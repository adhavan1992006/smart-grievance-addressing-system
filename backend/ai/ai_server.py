from flask import Flask, request, jsonify
import joblib
import os

app = Flask(__name__)


# =====================================================
# CURRENT DIRECTORY
# =====================================================

current_dir = os.path.dirname(
    os.path.abspath(__file__)
)


# =====================================================
# MODEL PATH
# =====================================================

model_path = os.path.join(
    current_dir,
    "grievance_model.pkl"
)


# =====================================================
# LOAD MODEL ONLY ONCE
# =====================================================

print("Loading AI model...")

model = joblib.load(model_path)

print("AI model loaded successfully.")


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/")
@app.get("/health")
def health():
    return jsonify({
        "status": "ok",
        "model_loaded": True,
        "classes_count": len(model.classes_)
    })


# =====================================================
# AI PREDICTION
# =====================================================

@app.post("/predict")
def predict():

    try:

        data = request.get_json()

        description = data.get(
            "description",
            ""
        ).strip()


        # =============================================
        # EMPTY DESCRIPTION
        # =============================================

        if not description:

            return jsonify({

                "success": False,

                "category":
                    "No Category Detected",

                "confidence": 0

            })


        # =============================================
        # PREDICTION
        # =============================================

        probabilities = model.predict_proba(
            [description]
        )[0]


        classes = model.classes_


        predicted_index = probabilities.argmax()


        predicted_category = (
            classes[predicted_index]
        )


        confidence = float(
            probabilities[predicted_index]
        )


        # =============================================
        # CONFIDENCE THRESHOLD (Calibrated for 16 classes)
        # Uniform random distribution is 1/16 = 0.0625.
        # Threshold of 0.25 represents 4x random probability.
        # =============================================

        CONFIDENCE_THRESHOLD = 0.25

        if confidence < CONFIDENCE_THRESHOLD:

            predicted_category = (
                "No Category Detected"
            )


        # =============================================
        # RESPONSE
        # =============================================

        return jsonify({

            "success": True,

            "category":
                predicted_category,

            "confidence":
                round(confidence, 4)

        })


    except Exception as error:

        print(
            "Prediction Error:",
            error
        )


        return jsonify({

            "success": False,

            "message":
                "AI prediction failed"

        }), 500


# =====================================================
# START SERVER
# =====================================================

if __name__ == "__main__":

    print(
        "AI Server running on http://127.0.0.1:8000"
    )

    app.run(
        host="127.0.0.1",
        port=8000,
        debug=False
    )