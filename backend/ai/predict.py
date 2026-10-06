import joblib
import sys
import os


# =====================================================
# GET CURRENT DIRECTORY
# =====================================================

current_dir = os.path.dirname(os.path.abspath(__file__))


# =====================================================
# LOAD TRAINED MODEL
# =====================================================

model_path = os.path.join(
    current_dir,
    "grievance_model.pkl"
)

model = joblib.load(model_path)


# =====================================================
# GET COMPLAINT DESCRIPTION
# =====================================================

description = " ".join(sys.argv[1:]).strip()


# =====================================================
# CHECK EMPTY DESCRIPTION
# =====================================================

if not description:

    print("No Category Detected")
    sys.exit(0)


# =====================================================
# PREDICT CATEGORY + CONFIDENCE
# =====================================================

probabilities = model.predict_proba([description])[0]

classes = model.classes_

max_probability = max(probabilities)

predicted_index = probabilities.argmax()

predicted_category = classes[predicted_index]


# =====================================================
# CONFIDENCE THRESHOLD
# =====================================================

CONFIDENCE_THRESHOLD = 0.25


if max_probability < CONFIDENCE_THRESHOLD:

    print("No Category Detected")

else:

    print(predicted_category)