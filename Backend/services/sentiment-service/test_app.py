import unittest

from app import classify_sentiment


class SentimentClassificationTests(unittest.TestCase):
    def test_positive_reflection(self):
        label, score = classify_sentiment("I completed the task and learned a lot. Great progress!")
        self.assertEqual(label, "POSITIVE")
        self.assertGreaterEqual(score, 0.6)

    def test_negative_reflection(self):
        label, score = classify_sentiment("I am frustrated and stuck on a difficult issue.")
        self.assertEqual(label, "NEGATIVE")
        self.assertLessEqual(score, 0.4)

    def test_neutral_reflection(self):
        label, score = classify_sentiment("I attended the daily meeting and updated the document.")
        self.assertEqual(label, "NEUTRAL")
        self.assertGreater(score, 0.4)
        self.assertLess(score, 0.6)


if __name__ == "__main__":
    unittest.main()
