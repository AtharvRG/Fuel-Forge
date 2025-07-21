import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import joblib
import os
import time
from scipy.sparse import hstack

# --- Configuration ---
DATA_FILE = 'fuel_blends_training_data_v3.csv'
MODEL_DIR = 'models'
EPOCHS = 50
BATCH_SIZE = 32

# --- GPU Check and Setup ---
print("TensorFlow Version:", tf.__version__)
gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
        logical_gpus = tf.config.experimental.list_logical_devices('GPU')
        print(f"Found {len(gpus)} Physical GPUs, {len(logical_gpus)} Logical GPUs")
        print("GPU acceleration is ENABLED.")
    except RuntimeError as e:
        print(e)
else:
    print("No GPU found. Training will use CPU.")

os.makedirs(MODEL_DIR, exist_ok=True)

# --- Load and Prepare Data ---
print(f"Loading master data from '{DATA_FILE}'...")
df = pd.read_csv(DATA_FILE).dropna(how='all', axis=1)

df_gasoline = df[df['fuel_type'] == 'gasoline'].drop(columns=['fuel_type', 'CN']).dropna()
df_diesel = df[df['fuel_type'] == 'diesel'].drop(columns=['fuel_type', 'RON', 'MON', 'AKI']).dropna()

print(f"Loaded {len(df_gasoline)} gasoline blends and {len(df_diesel)} diesel blends.")

# --- Reusable Model Training Function ---
def train_fuel_model(df_data, target_cols, model_name):
    print(f"\n{'='*20} TRAINING MODEL: {model_name.upper()} {'='*20}")
    
    X = df_data.drop(columns=target_cols)
    y = df_data[target_cols]
    
    categorical_features = X.select_dtypes(include=['object']).columns
    numerical_features = X.select_dtypes(include=['number']).columns
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    num_preprocessor = StandardScaler()
    X_train_num = num_preprocessor.fit_transform(X_train[numerical_features])
    X_test_num = num_preprocessor.transform(X_test[numerical_features])

    cat_preprocessor = OneHotEncoder(handle_unknown='ignore', sparse_output=True)
    X_train_cat_sparse = cat_preprocessor.fit_transform(X_train[categorical_features])
    X_test_cat_sparse = cat_preprocessor.transform(X_test[categorical_features])

    X_train_processed_sparse = hstack([X_train_num, X_train_cat_sparse]).tocsr()
    X_test_processed_sparse = hstack([X_test_num, X_test_cat_sparse]).tocsr()
    
    print(f"Processed data shape: {X_train_processed_sparse.shape}")

    preprocessor = {'numerical': num_preprocessor, 'categorical': cat_preprocessor}
    
    model = keras.Sequential([
        layers.Input(shape=(X_train_processed_sparse.shape[1],)),
        layers.Dense(256, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.Dropout(0.3),
        layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(0.001)),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        layers.Dense(len(target_cols))
    ])
    
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001), 
                  loss='mean_squared_error', 
                  metrics=['mean_absolute_error'])
    model.summary()
    
    print("Starting model training...")
    early_stopping = keras.callbacks.EarlyStopping(monitor='val_loss', patience=20, restore_best_weights=True)
    
    history = model.fit(
        X_train_processed_sparse, y_train.values,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_test_processed_sparse, y_test.values),
        callbacks=[early_stopping],
        verbose=1
    )
    
    print("\nEvaluating model on test data...")
    loss, mae = model.evaluate(X_test_processed_sparse, y_test.values, verbose=0) # <--- Also use .values here for consistency
    print(f"Test Set Mean Absolute Error: {mae:.4f}")
    
    preprocessor_path = os.path.join(MODEL_DIR, f'{model_name}_preprocessor.joblib')
    model_path = os.path.join(MODEL_DIR, f'{model_name}_model.keras')
    joblib.dump(preprocessor, preprocessor_path)
    model.save(model_path)
    print(f"Successfully saved preprocessor to '{preprocessor_path}'")
    print(f"Successfully saved model to '{model_path}'")

gasoline_targets = [
    'RON', 'MON', 'AKI', 'LHV', 'Density', 'O2_wt_percent',
    'Oxidative_Stability', 'Gum_Content', 'Acidity'
]
diesel_targets = [
    'CN', 'LHV', 'Density', 'O2_wt_percent',
    'Oxidative_Stability', 'Gum_Content', 'Acidity'
]

train_fuel_model(df_gasoline, gasoline_targets, 'gasoline')
train_fuel_model(df_diesel, diesel_targets, 'diesel')

print("\n--- AI model training complete! ---")