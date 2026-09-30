import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

#Loading the dataset
df = pd.read_csv("Servo_Fuzzy_Controller.csv")

print("Dataset shape:", df.shape)

#Separating features and target variable
X = df.drop("Class", axis=1)
y = df["Class"]

print("\nFeatures:")
print(X.columns.tolist())

print("\nClasses:")
print(y.unique())

#Splitting the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))

#Creating model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)

#Training the model
print("\nTraining model...")

model.fit(X_train, y_train)

print("Training complete!")

#Prediction
y_pred = model.predict(X_test)

#Accuracy
accuracy = accuracy_score(y_test, y_pred)

print("\nAccuracy:")
print(accuracy)

#Classification Report
print("\nClassification Report:")
print(classification_report(y_test, y_pred))

#Confusion Matrix
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

#Feature Importance
print("\nFeature Importance:")

feature_importance = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(ascending=False)

print(feature_importance)