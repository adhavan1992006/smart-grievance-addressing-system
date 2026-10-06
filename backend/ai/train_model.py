import os
import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline


# =========================
# CURRENT DIRECTORY
# =========================

current_dir = os.path.dirname(
    os.path.abspath(__file__)
)


# =========================
# DATASET
# =========================

dataset_path = os.path.join(
    current_dir,
    "grievance_keyword_dataset.csv"
)

data = pd.read_csv(dataset_path)


# Remove missing values

data = data.dropna(
    subset=["description", "category"]
)


# =========================
# FEATURES AND LABELS
# =========================

X = data["description"]
y = data["category"]


# =========================
# AI MODEL
# =========================

model = Pipeline([

    (
        "tfidf",
        TfidfVectorizer(

            ngram_range=(1, 2),

            lowercase=True,

            sublinear_tf=True,

            stop_words="english"

        )
    ),

    (
        "classifier",
        MultinomialNB(
            alpha=0.1
        )
    )

])


# =========================
# TRAIN
# =========================

model.fit(X, y)


# =========================
# SAVE MODEL & VECTORIZER
# =========================

model_path = os.path.join(
    current_dir,
    "grievance_model.pkl"
)

vectorizer_path = os.path.join(
    current_dir,
    "vectorizer.pkl"
)

# Save complete pipeline
joblib.dump(
    model,
    model_path
)

# Save standalone vectorizer for compatibility
joblib.dump(
    model.named_steps["tfidf"],
    vectorizer_path
)

print(
    "AI Model and Vectorizer Saved Successfully"
)

print(
    "Model path:", model_path
)
print(
    "Vectorizer path:", vectorizer_path
)
print(
    "Categories:",
    list(model.classes_)
)