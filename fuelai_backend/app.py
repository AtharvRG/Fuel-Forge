# fuelai_backend/app.py (Complete, Final Version)

import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import tensorflow as tf
import os
from scipy.sparse import hstack

# --- Initialize Flask App ---
app = Flask(__name__)
CORS(app)

# --- Load Models, Preprocessors, and Component Database ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, 'models')
COMPONENT_DATABASE = os.path.join(BASE_DIR, 'pure_components_synthetic_data_v4.csv')

try:
    # --- Models ---
    gasoline_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, 'gasoline_model.keras'))
    gasoline_preprocessor = joblib.load(os.path.join(MODEL_DIR, 'gasoline_preprocessor.joblib'))
    diesel_model = tf.keras.models.load_model(os.path.join(MODEL_DIR, 'diesel_model.keras'))
    diesel_preprocessor = joblib.load(os.path.join(MODEL_DIR, 'diesel_preprocessor.joblib'))
    print("--- All models loaded successfully! ---")

    # --- Component Database for UI and Calculations ---
    df_components = pd.read_csv(COMPONENT_DATABASE).set_index('name')
    
    # --- Filtered Lists for UI Dropdowns ---
    gasoline_bases = df_components[(df_components['O2_wt_percent'] < 1.5) & (df_components['RON'] > 60) & (df_components['carbons'].between(5, 12))].index.unique().tolist()
    gasoline_additives = df_components[df_components['O2_wt_percent'] > 10.0].index.unique().tolist()
    diesel_bases = df_components[(df_components['CN'] > 45) & (df_components['carbons'].between(10, 22)) & (df_components['family'].str.contains('Alkane')) & (df_components['O2_wt_percent'] < 1.5)].index.unique().tolist()
    diesel_additives = df_components[(df_components['O2_wt_percent'] > 5.0) & (df_components['CN'] < 40)].index.unique().tolist()
    print("--- Component lists for UI created successfully! ---")

except Exception as e:
    print(f"--- FATAL ERROR during initialization: {e} ---")
    gasoline_model = None
    df_components = None

# --- Helper function to create data for the Cascader component WITH DETAILS ---
def cascader_group_components(name_list, full_df):
    grouped = {}
    relevant_components = full_df[full_df.index.isin(name_list)]

    for name, properties in relevant_components.iterrows():
        base_name = name.split(' (')[0]
        if base_name not in grouped:
            grouped[base_name] = []
        
        # Properties for the tooltip
        details = {
            'RON': properties.get('RON'),
            'MON': properties.get('MON'),
            'CN': properties.get('CN'),
            'LHV': properties.get('LHV'),
            'Density': properties.get('Density'),
            'O2_wt_percent': properties.get('O2_wt_percent')
        }
        # Remove keys with None/NaN values
        clean_details = {k: v for k, v in details.items() if pd.notna(v)}

        grouped[base_name].append({
            'value': name,
            'label': name,
            'details': clean_details
        })

    output = []
    for base_name, children in sorted(grouped.items()):
        output.append({
            'value': base_name,
            'label': base_name,
            'children': sorted(children, key=lambda x: x['label'])
        })
    return output

def calculate_viability_score(component_details):
    if not component_details or len(component_details) < 2:
        return 100.0, "Single component is always stable."

    def normalize(value, min_val, max_val):
        return (value - min_val) / (max_val - min_val)

    total_pct = sum(c['percentage'] for c in component_details)
    total_pct = sum(c['percentage'] for c in component_details)
    if total_pct == 0: total_pct = 1

    avg_density = sum(c['Density'] * (c['percentage'] / total_pct) for c in component_details)
    avg_bp = sum(df_components.loc[c['name'], 'BP'] * (c['percentage'] / total_pct) for c in component_details)
    avg_o2 = sum(df_components.loc[c['name'], 'O2_wt_percent'] * (c['percentage'] / total_pct) for c in component_details)

    # Calculate the weighted standard deviation for each property. A high deviation means components are very different.
    dev_density = sum(((c['Density'] - avg_density)**2) * (c['percentage'] / total_pct) for c in component_details)**0.5
    dev_bp = sum(((df_components.loc[c['name'], 'BP'] - avg_bp)**2) * (c['percentage'] / total_pct) for c in component_details)**0.5
    dev_o2 = sum(((df_components.loc[c['name'], 'O2_wt_percent'] - avg_o2)**2) * (c['percentage'] / total_pct) for c in component_details)**0.5

    # Normalize the deviations. These ranges are estimates and can be tuned.
    # A value of 0 is perfect similarity, 1 is very dissimilar.
    norm_dev_density = normalize(dev_density, 0, 0.15) # Max 0.15 g/mL difference
    norm_dev_bp = normalize(dev_bp, 0, 100) # Max 100°C BP difference
    norm_dev_o2 = normalize(dev_o2, 0, 20)  # Max 20% O2 content difference

    # Combine the penalties. O2 content difference is the most important factor for phase separation.
    total_penalty = (norm_dev_density * 0.2) + (norm_dev_bp * 0.2) + (norm_dev_o2 * 0.6)
    
    viability_score = (1 - min(1, total_penalty)) * 100

    insight = ""
    if viability_score > 90:
        insight = "Excellent. Components are highly similar, suggesting the blend will be very stable and miscible."
    elif viability_score > 70:
        insight = "Good. Components have moderate differences but are likely to form a stable blend under normal conditions."
    elif viability_score > 40:
        insight = "Fair. Significant property differences exist. The blend may be prone to phase separation, especially at low temperatures or with water contamination."
    else:
        insight = "Poor. Components are highly dissimilar. This blend is very likely to be unstable and separate into layers. Not recommended."

    return round(viability_score, 1), insight

# --- API Endpoints ---

@app.route('/api/get_components', methods=['GET'])
def get_components():
    if df_components is None:
        return jsonify({'error': 'Component database not loaded on server.'}), 500
    
    return jsonify({
        'gasolineBases': cascader_group_components(gasoline_bases, df_components),
        'gasolineAdditives': cascader_group_components(gasoline_additives, df_components),
        'dieselBases': cascader_group_components(diesel_bases, df_components),
        'dieselAdditives': cascader_group_components(diesel_additives, df_components)
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    if not gasoline_model:
        return jsonify({'error': 'Models are not loaded on the server.'}), 500

    data = request.get_json()
    print("Received prediction request:", data)

    fuel_type = data.get('fuelType')
    recipe = data.get('recipe', [])
    if not recipe:
        return jsonify({'error': 'Recipe cannot be empty.'}), 400

    sorted_recipe = sorted(recipe, key=lambda x: x['percentage'], reverse=True)
    comp1_data = sorted_recipe[0]
    comp2_data = sorted_recipe[1] if len(sorted_recipe) > 1 else {'name': comp1_data['name'], 'percentage': 0}
    
    input_df = pd.DataFrame([{
        'component_1': comp1_data['name'], 'component_1_vol_pct': comp1_data['percentage'],
        'component_2': comp2_data['name'], 'component_2_vol_pct': comp2_data['percentage']
    }])

    try:
        if fuel_type == 'gasoline':
            model, preprocessor_dict = gasoline_model, gasoline_preprocessor
            target_names = ['RON', 'MON', 'AKI', 'LHV', 'Density', 'O2_wt_percent', 'Oxidative_Stability', 'Gum_Content', 'Acidity']
        elif fuel_type == 'diesel':
            model, preprocessor_dict = diesel_model, diesel_preprocessor
            target_names = ['CN', 'LHV', 'Density', 'O2_wt_percent', 'Oxidative_Stability', 'Gum_Content', 'Acidity']
        else:
            return jsonify({'error': 'Invalid fuel type specified.'}), 400

        num_preprocessor = preprocessor_dict['numerical']
        cat_preprocessor = preprocessor_dict['categorical']
        numerical_features = input_df.select_dtypes(include=['number']).columns
        categorical_features = input_df.select_dtypes(include=['object']).columns

        input_num_processed = num_preprocessor.transform(input_df[numerical_features])
        input_cat_processed_sparse = cat_preprocessor.transform(input_df[categorical_features])
        input_processed_sparse = hstack([input_num_processed, input_cat_processed_sparse]).tocsr()
        
        prediction = model.predict(input_processed_sparse)[0]
        results = {name: round(float(value), 2) for name, value in zip(target_names, prediction)}

        total_pct = sum(c['percentage'] for c in recipe)
        if total_pct == 0: total_pct = 1

        cost = 0
        component_details = []
        for item in recipe:
            comp_props = df_components.loc[item['name']]
            base_cost = 0.60 + (comp_props.get('carbons', 0) * 0.015)
            oxy_premium = 1.15 if comp_props.get('O2_wt_percent', 0) > 10 else 1.0
            cost += base_cost * oxy_premium * (item['percentage'] / total_pct)
            
            details_dict = comp_props.to_dict()
            safe_details = {k: (None if pd.isna(v) else v) for k, v in details_dict.items()}
            component_details.append({
                'name': item['name'], 'percentage': item['percentage'],
                'RON': safe_details.get('RON'), 'CN': safe_details.get('CN'),
                'LHV': safe_details.get('LHV'), 'Density': safe_details.get('Density')
            })

        results['Simulated_Cost_per_L'] = round(cost, 3)
        
        lhv_norm = (results.get('LHV', 30) - 20) / (48 - 20)
        density_norm = (results.get('Density', 0.7) - 0.6) / (1.0 - 0.6)
        efficiency_score = (lhv_norm * 0.7 + (1 - density_norm) * 0.3) * 100
        results['Efficiency_Score'] = round(efficiency_score, 1)
        
        viability_score, viability_insight = calculate_viability_score(component_details)
        results['Viability_Score'] = viability_score
        results['viability_insight'] = viability_insight
        
        insight_text = f"This {fuel_type} blend, primarily composed of {recipe[0]['name']}, shows "
        if fuel_type == 'gasoline':
            insight_text += f"strong anti-knock properties (RON: {results['RON']}). " if results.get('RON', 0) > 95 else f"standard octane characteristics (RON: {results['RON']}). "
        else:
            insight_text += f"very good ignition quality (CN: {results['CN']}). " if results.get('CN', 0) > 50 else f"adequate ignition quality (CN: {results['CN']}). "
        
        if results.get('O2_wt_percent', 0) > 5:
            insight_text += f"The high oxygen content ({results['O2_wt_percent']}%) suggests cleaner combustion but may slightly reduce the energy density. "
        
        insight_text += "It appears to be a cost-effective formulation." if results.get('Simulated_Cost_per_L', 0) <= 1.0 else "Its formulation indicates a higher production cost."

        results['ai_insight'] = insight_text
        results['component_details'] = component_details
        results['id'] = f"blend_{int(time.time() * 1000)}"
        results['recipe'] = recipe

        return jsonify(results)

    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({'error': f'An error occurred during prediction: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)