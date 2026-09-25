from collections import Counter


class NumberTrendModel:
    """A transparent frequency/recentness heuristic, not a guaranteed predictor."""

    def predict(self, history):
        values = [int(value) for value in history]
        if not values:
            return 0, 0.10

        recent = values[-20:]
        counts = Counter(values)
        recent_weight = Counter()
        for position, value in enumerate(reversed(recent), start=1):
            recent_weight[value] += position

        scores = {}
        for number in range(10):
            scores[number] = (
                counts[number] * 2.0
                + recent_weight[number] * 1.5
            )

        predicted = max(range(10), key=lambda number: scores[number])
        ordered = sorted(scores.values(), reverse=True)
        margin = ordered[0] - (ordered[1] if len(ordered) > 1 else 0)
        confidence = min(0.90, max(0.15, 0.15 + margin / 20.0))
        return predicted, confidence
