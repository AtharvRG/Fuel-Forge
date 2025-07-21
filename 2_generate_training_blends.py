import csv
import random
import numpy as np
import pandas as pd
import time

# --- Configuration ---
NUM_GASOLINE_BLENDS = 50000
NUM_DIESEL_BLENDS = 50000
INPUT_DATABASE_FILE = 'pure_components_synthetic_data_v4.csv' 
OUTPUT_FILE = 'fuel_blends_training_data_v3.csv' 

def generate_blends():
    # --- Load the Component Database ---
    print(f"Loading component database from '{INPUT_DATABASE_FILE}'...")
    try:
        # Drop rows where critical properties are missing for blending
        df_components = pd.read_csv(INPUT_DATABASE_FILE).dropna(
            subset=['RON', 'MON', 'CN', 'Density', 'LHV', 'O2_wt_percent', 
                    'Oxidative_Stability', 'Gum_Content', 'Acidity'] 
        )
    except FileNotFoundError:
        print(f"ERROR: Database file '{INPUT_DATABASE_FILE}' not found.")
        print("Please run '1_generate_component_database.py' first.")
        return

    # --- Filtering ---
    print("Filtering components into fuel categories...")
    BASE_GASOLINES_DF = df_components[
        (df_components['O2_wt_percent'] < 1.5) & (df_components['RON'] > 60) &
        (df_components['carbons'] >= 5) & (df_components['carbons'] <= 12)
    ].copy()
    OXYGENATES_DF = df_components[df_components['O2_wt_percent'] > 10.0].copy()
    DIESEL_BASE_DF = df_components[
        (df_components['CN'] > 45) & (df_components['carbons'] >= 10) &
        (df_components['carbons'] <= 22) & (df_components['family'].str.contains('Alkane')) &
        (df_components['O2_wt_percent'] < 1.5)
    ].copy()
    DIESEL_ADDITIVES_DF = df_components[
        (df_components['O2_wt_percent'] > 5.0) & (df_components['CN'] < 40)
    ].copy()

    if any(df.empty for df in [BASE_GASOLINES_DF, OXYGENATES_DF, DIESEL_BASE_DF, DIESEL_ADDITIVES_DF]):
        print("ERROR: One or more component categories are empty after filtering.")
        return
        
    print(f"Found {len(BASE_GASOLINES_DF)} base gasolines, {len(OXYGENATES_DF)} oxygenates, {len(DIESEL_BASE_DF)} diesel components.")

    # --- Vectorized Gasoline Blend Generation ---
    print(f"\nGenerating {NUM_GASOLINE_BLENDS} gasoline blends (vectorized)...")
    
    base_indices = np.random.randint(0, len(BASE_GASOLINES_DF), size=NUM_GASOLINE_BLENDS)
    oxy_indices = np.random.randint(0, len(OXYGENATES_DF), size=NUM_GASOLINE_BLENDS)
    
    base_props_df = BASE_GASOLINES_DF.iloc[base_indices].reset_index(drop=True)
    oxy_props_df = OXYGENATES_DF.iloc[oxy_indices].reset_index(drop=True)

    additive_pct = np.random.uniform(0.5, 40.0, size=NUM_GASOLINE_BLENDS)
    vf_oxy = additive_pct / 100.0
    vf_base = 1.0 - vf_oxy

    # --- Perform blending calculations on entire arrays (vectorized) ---
    # Existing properties
    ron = base_props_df['RON'].values + ((oxy_props_df['RON'].values - base_props_df['RON'].values) * (vf_oxy**0.85))
    mon = base_props_df['MON'].values + ((oxy_props_df['MON'].values - base_props_df['MON'].values) * (vf_oxy**0.95))
    
    mass_base = vf_base * base_props_df['Density'].values
    mass_oxy = vf_oxy * oxy_props_df['Density'].values
    total_mass = mass_base + mass_oxy
    
    density = base_props_df['Density'].values * vf_base + oxy_props_df['Density'].values * vf_oxy
    lhv = (mass_base * base_props_df['LHV'].values + mass_oxy * oxy_props_df['LHV'].values) / total_mass
    o2_wt = (mass_base * base_props_df['O2_wt_percent'].values + mass_oxy * oxy_props_df['O2_wt_percent'].values) / total_mass

    # --- Blend the new stability properties ---
    # Simple volumetric blending is a reasonable approximation for these trace properties
    stability = base_props_df['Oxidative_Stability'].values * vf_base + oxy_props_df['Oxidative_Stability'].values * vf_oxy
    gum = base_props_df['Gum_Content'].values * vf_base + oxy_props_df['Gum_Content'].values * vf_oxy
    acidity = base_props_df['Acidity'].values * vf_base + oxy_props_df['Acidity'].values * vf_oxy

    # --- Assemble the final DataFrame with ALL columns ---
    gasoline_df = pd.DataFrame({
        'fuel_type': 'gasoline',
        'component_1': base_props_df['name'],
        'component_1_vol_pct': 100.0 - additive_pct,
        'component_2': oxy_props_df['name'],
        'component_2_vol_pct': additive_pct,
        'RON': ron, 'MON': mon, 'AKI': (ron + mon) / 2,
        'LHV': lhv, 'Density': density, 'O2_wt_percent': o2_wt,
        'Oxidative_Stability': stability, 'Gum_Content': gum, 'Acidity': acidity # <-- ADDED HERE
    })

    # --- Vectorized Diesel Blend Generation ---
    print(f"Generating {NUM_DIESEL_BLENDS} diesel blends (vectorized)...")
    
    base_indices = np.random.randint(0, len(DIESEL_BASE_DF), size=NUM_DIESEL_BLENDS)
    additive_indices = np.random.randint(0, len(DIESEL_ADDITIVES_DF), size=NUM_DIESEL_BLENDS)
    
    base_props_df = DIESEL_BASE_DF.iloc[base_indices].reset_index(drop=True)
    additive_props_df = DIESEL_ADDITIVES_DF.iloc[additive_indices].reset_index(drop=True)
    
    additive_pct = np.random.uniform(0.5, 25.0, size=NUM_DIESEL_BLENDS)
    vf_additive = additive_pct / 100.0
    vf_base = 1.0 - vf_additive
    
    cn = base_props_df['CN'].values - ((base_props_df['CN'].values - additive_props_df['CN'].values) * (vf_additive**1.2))
    
    mass_base = vf_base * base_props_df['Density'].values
    mass_add = vf_additive * additive_props_df['Density'].values
    total_mass = mass_base + mass_add
    
    density = base_props_df['Density'].values * vf_base + additive_props_df['Density'].values * vf_additive
    lhv = (mass_base * base_props_df['LHV'].values + mass_add * additive_props_df['LHV'].values) / total_mass
    o2_wt = (mass_base * base_props_df['O2_wt_percent'].values + mass_add * additive_props_df['O2_wt_percent'].values) / total_mass

    # --- Blend the new stability properties for diesel ---
    stability = base_props_df['Oxidative_Stability'].values * vf_base + additive_props_df['Oxidative_Stability'].values * vf_additive
    gum = base_props_df['Gum_Content'].values * vf_base + additive_props_df['Gum_Content'].values * vf_additive
    acidity = base_props_df['Acidity'].values * vf_base + additive_props_df['Acidity'].values * vf_additive

    diesel_df = pd.DataFrame({
        'fuel_type': 'diesel',
        'component_1': base_props_df['name'],
        'component_1_vol_pct': 100.0 - additive_pct,
        'component_2': additive_props_df['name'],
        'component_2_vol_pct': additive_pct,
        'CN': cn, 'LHV': lhv, 'Density': density, 'O2_wt_percent': o2_wt,
        'Oxidative_Stability': stability, 'Gum_Content': gum, 'Acidity': acidity # <-- ADDED HERE
    })

    # --- Combine, Shuffle, and Save ---
    print("\nCombining and shuffling final dataset...")
    final_df = pd.concat([gasoline_df, diesel_df], ignore_index=True)
    final_df = final_df.sample(frac=1).reset_index(drop=True)
    
    # --- UPDATE the header and rounding lists ---
    numeric_cols = [
        'component_1_vol_pct', 'component_2_vol_pct', 'RON', 'MON', 'AKI', 'CN', 
        'LHV', 'Density', 'O2_wt_percent', 'Oxidative_Stability', 'Gum_Content', 'Acidity'
    ]
    for col in numeric_cols:
        if col in final_df.columns:
            final_df[col] = final_df[col].round(3)

    header = [
        'fuel_type', 'component_1', 'component_1_vol_pct', 'component_2', 'component_2_vol_pct',
        'RON', 'MON', 'AKI', 'CN', 'LHV', 'Density', 'O2_wt_percent',
        'Oxidative_Stability', 'Gum_Content', 'Acidity' # <-- ADDED HERE
    ]
    
    print(f"Saving {len(final_df)} total blends to '{OUTPUT_FILE}'...")
    final_df.to_csv(OUTPUT_FILE, index=False, columns=header) # Use the header to ensure order

    print("Success! Master training data file created.")

if __name__ == "__main__":
    start_time = time.time()
    generate_blends()
    end_time = time.time()
    print(f"\nTotal generation time: {end_time - start_time:.2f} seconds.")