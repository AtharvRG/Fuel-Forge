import csv
import random
import numpy as np
import re
import time

# --- Configuration ---
NUM_ROWS_TO_GENERATE = 50000
MAX_GENERATION_ATTEMPTS_PER_COMPOUND = 100

# --- Seed Data (initial known compounds) ---
SEED_DATA = {
    'n-Alkanes': [
        {'name': 'n-Pentane', 'carbons': 5, 'RON': 62.0, 'MON': 61.9, 'CN': 30, 'LHV': 45.4, 'Density': 0.626, 'BP': 36, 'FP': -49, 'Oxidative_Stability': 1000, 'Gum_Content': 0.1, 'Acidity': 0.001},
        {'name': 'n-Heptane', 'carbons': 7, 'RON': 0.0, 'MON': 0.0, 'CN': 56, 'LHV': 44.6, 'Density': 0.684, 'BP': 98, 'FP': -4, 'Oxidative_Stability': 1000, 'Gum_Content': 0.1, 'Acidity': 0.001},
    ],
    'iso-Alkanes': [ 
        {'name': 'Isooctane', 'carbons': 8, 'RON': 100.0, 'MON': 100.0, 'CN': 17, 'LHV': 44.3, 'Density': 0.692, 'BP': 99, 'FP': -12, 'Oxidative_Stability': 1000, 'Gum_Content': 0.2, 'Acidity': 0.001},
    ],
    'Alkenes': [
        {'name': '1-Hexene', 'carbons': 6, 'RON': 76.4, 'MON': 63.4, 'CN': 27, 'LHV': 44.9, 'Density': 0.673, 'BP': 63, 'FP': -25, 'Oxidative_Stability': 100, 'Gum_Content': 4.0, 'Acidity': 0.01},
    ],
    'Aromatics': [
        {'name': 'Toluene', 'carbons': 7, 'RON': 120.0, 'MON': 107.0, 'CN': 3, 'LHV': 40.6, 'Density': 0.867, 'BP': 111, 'FP': 4, 'Oxidative_Stability': 480, 'Gum_Content': 1.5, 'Acidity': 0.005},
    ],
    'Alcohols': [
        {'name': 'Ethanol', 'carbons': 2, 'RON': 108.6, 'MON': 89.7, 'CN': 8, 'LHV': 26.8, 'Density': 0.790, 'BP': 78, 'FP': 13, 'Oxidative_Stability': 900, 'Gum_Content': 0.5, 'Acidity': 0.002},
    ],
    'Esters': [
        {'name': 'Methyl Palmitate', 'carbons': 17, 'RON': None, 'MON': None, 'CN': 86, 'LHV': 39.2, 'Density': 0.852, 'BP': 315, 'FP': 148, 'Oxidative_Stability': 600, 'Gum_Content': 2.0, 'Acidity': 0.15},
    ]
}

# --- Property Bounding ---
PROPERTY_BOUNDS = {
    'RON': (-40, 130), 'MON': (-40, 120), 'CN': (0, 120),
    'LHV': (20, 48), 'Density': (0.6, 1.0),
    'BP': (-50, 400), 'FP': (-100, 300),
    'Oxidative_Stability': (10, 1200), # hours
    'Gum_Content': (0.1, 10), # mg/100mL
    'Acidity': (0.001, 0.5) # mg KOH/g
}
# --- Property trends ---
# Lower stability/higher gum for more reactive families
PROP_TRENDS = {
    'n-Alkanes': {'RON': -15, 'MON': -15, 'CN': 8, 'LHV': -0.2, 'Density': 0.015, 'BP': 28, 'FP': 20, 'Oxidative_Stability': -10, 'Gum_Content': 0.01, 'Acidity': 0},
    'iso-Alkanes': {'RON': -10, 'MON': -10, 'CN': -4, 'LHV': -0.1, 'Density': 0.01, 'BP': 25, 'FP': 18, 'Oxidative_Stability': -5, 'Gum_Content': 0.02, 'Acidity': 0},
    'Alkenes': {'RON': -12, 'MON': -18, 'CN': 7, 'LHV': -0.15, 'Density': 0.018, 'BP': 29, 'FP': 22, 'Oxidative_Stability': -20, 'Gum_Content': 0.5, 'Acidity': 0.001},
    'Aromatics': {'RON': -8, 'MON': -10, 'CN': 1, 'LHV': -0.2, 'Density': 0.0, 'BP': 22, 'FP': 10, 'Oxidative_Stability': -15, 'Gum_Content': 0.2, 'Acidity': 0},
    'Alcohols': {'RON': -10, 'MON': -12, 'CN': 3, 'LHV': 1.5, 'Density': 0.005, 'BP': 20, 'FP': 12, 'Oxidative_Stability': -2, 'Gum_Content': 0.05, 'Acidity': 0.001},
    'Esters': {'RON': None, 'MON': None, 'CN': 10, 'LHV': 0.3, 'Density': -0.003, 'BP': 25, 'FP': 15, 'Oxidative_Stability': -10, 'Gum_Content': 0.1, 'Acidity': 0.01},
}

# --- Carbon Number Ranges ---
CARBON_RANGES = {
    'n-Alkanes': (2, 25), 'iso-Alkanes': (4, 25), 'Alkenes': (2, 25),
    'Aromatics': (6, 25), 'Alcohols': (1, 25), 'Esters': (3, 25)
}

# --- Helper Functions ---
def get_prefix(n):
    prefixes = {1: 'Meth', 2: 'Eth', 3: 'Prop', 4: 'But', 5: 'Pent', 6: 'Hex',
                7: 'Hept', 8: 'Oct', 9: 'Non', 10: 'Dec', 11: 'Undec', 12: 'Dodec',
                13: 'Tridec', 14: 'Tetradec', 15: 'Pentadec', 16: 'Hexadec',
                17: 'Heptadec', 18: 'Octadec', 19: 'Nonadec', 20: 'Eicos',
                21: 'Henicos', 22: 'Docos'}
    return prefixes.get(n, f'C{n}')

def get_formula(carbons, family):
    if family in ['n-Alkanes', 'iso-Alkanes']: return f'C{carbons}H{2*carbons + 2}'
    elif family == 'Alkenes': return f'C{carbons}H{2*carbons}'
    elif family == 'Aromatics': return f'C{carbons}H{2*carbons - 6}'
    elif family == 'Alcohols': return f'C{carbons}H{2*carbons + 2}O'
    elif family == 'Esters': return f'C{carbons}H{2*carbons}O2'
    return f'C{carbons}'

def process_entry(entry):
    """Calculates all derived properties for a compound dictionary."""
    entry['formula'] = get_formula(entry['carbons'], entry['family'])
    counts = re.findall(r'([CHO])(\d*)', entry['formula'])
    c, h, o = 0, 0, 0
    for element, count in counts:
        count = int(count) if count else 1
        if element == 'C': c = count
        elif element == 'H': h = count
        elif element == 'O': o = count
    
    entry['Molecular_Weight'] = round(c * 12.01 + h * 1.008 + o * 16.00, 2)
    entry['O2_wt_percent'] = round((o * 16.00 / entry['Molecular_Weight']) * 100, 2) if entry['Molecular_Weight'] > 0 else 0
    entry['HC_ratio'] = round(h / c, 2) if c > 0 else 0
    
    if entry.get('RON') is not None and entry.get('MON') is not None:
        entry['AKI'] = round((entry['RON'] + entry['MON']) / 2, 1)
    else:
        entry['AKI'] = None
    return entry

def generate_pure_component_data(num_rows):
    """
    Generates a list of synthetic pure component data using rejection sampling
    to ensure all properties are physically plausible.
    """
    all_data = []
    names_added = set()

    # 1. Add all seed data first
    for family, compounds in SEED_DATA.items():
        for compound in compounds:
            if compound['name'] not in names_added:
                entry = compound.copy()
                entry['family'] = family
                all_data.append(process_entry(entry))
                names_added.add(entry['name'])

    # 2. Generate synthetic compounds until the target is reached
    while len(all_data) < num_rows:
        family = random.choice(list(CARBON_RANGES.keys()))
        trends = PROP_TRENDS[family]
        min_c, max_c = CARBON_RANGES[family]
        new_carbons = random.randint(min_c, max_c)

        # Find the best seed compound to use as a reference
        base_ref = min(SEED_DATA[family], key=lambda x: abs(x['carbons'] - new_carbons))
        carbon_shift = new_carbons - base_ref['carbons']

        # --- Inner Rejection Sampling Loop ---
        # This loop tries to generate a valid set of properties for the chosen compound.
        # It is fast because it only repeats the property calculation, not the name search.
        for _ in range(MAX_GENERATION_ATTEMPTS_PER_COMPOUND):
            candidate_entry = {'carbons': new_carbons, 'family': family}
            is_valid = True

            # Estimate properties and check bounds immediately
            for prop, slope in trends.items():
                if slope is None or base_ref.get(prop) is None:
                    candidate_entry[prop] = None
                    continue
                
                # Add noise for variety
                val = base_ref[prop] + carbon_shift * slope
                noise = abs(val * 0.05) + 0.5 
                estimated_val = val + np.random.normal(0, noise)
                # THE KEY CHANGE: Check bounds, don't clip.
                min_bound, max_bound = PROPERTY_BOUNDS[prop]
                if not (min_bound <= estimated_val <= max_bound):
                    is_valid = False
                    break # This attempt is invalid, break and try again
                
                candidate_entry[prop] = round(estimated_val, 2)

            # If all properties were valid, we have a good candidate
            if is_valid:
                # --- Naming Logic (only after validation) ---
                base_name = ""
                if family == 'n-Alkanes': base_name = f'n-{get_prefix(new_carbons)}ane'
                elif family == 'iso-Alkanes': base_name = f'iso-{get_prefix(new_carbons)}ane'
                elif family == 'Alkenes': base_name = f'1-{get_prefix(new_carbons)}ene'
                elif family == 'Aromatics':
                    if new_carbons == 6: base_name = 'Benzene'
                    else: base_name = f'{get_prefix(new_carbons - 6)}ylbenzene'
                elif family == 'Alcohols': base_name = f'1-{get_prefix(new_carbons)}anol'
                elif family == 'Esters': base_name = f'Methyl {get_prefix(new_carbons-1).lower()}anoate'

                # Guarantee a unique name
                final_name = base_name
                isomer_idx = 2
                while final_name in names_added:
                    final_name = f"{base_name} (synth. #{isomer_idx})"
                    isomer_idx += 1
                
                candidate_entry['name'] = final_name
                
                # Process and add the final, valid entry
                all_data.append(process_entry(candidate_entry))
                names_added.add(final_name)
                break # Exit the inner attempt loop and move to the next compound
        # If the inner loop finishes without a 'break', it means it failed 100 times.
        # The outer loop will continue, trying a different random compound.
    random.shuffle(all_data)
    return all_data[:num_rows]
# --- Main Execution ---
if __name__ == "__main__":
    start_time = time.time()
    print(f"Generating {NUM_ROWS_TO_GENERATE} synthetic pure component entries...")

    data = generate_pure_component_data(NUM_ROWS_TO_GENERATE)
    header = [
        'name', 'formula', 'family', 'carbons', 'Molecular_Weight', 'HC_ratio', 'O2_wt_percent',
        'RON', 'MON', 'AKI', 'CN', 'LHV', 'Density', 'BP', 'FP',
        'Oxidative_Stability', 'Gum_Content', 'Acidity'
    ]
    filename = "pure_components_synthetic_data_v4.csv" # New version number
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=header)
        writer.writeheader()
        # The writer will automatically handle the new keys
        writer.writerows(data)

    end_time = time.time()
    print(f"Successfully saved to '{filename}' with {len(data)} rows.")
    print(f"Generation took {end_time - start_time:.2f} seconds.")