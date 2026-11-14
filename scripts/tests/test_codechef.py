import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fetchers.codechef import _profile_metrics
from fetchers.utils import retry_delay


class CodeChefProfileMetricsTests(unittest.TestCase):
    def test_extracts_public_profile_metrics(self):
        html = '''
        <h3>Total Problems Solved: 1,280</h3>
        <div id="rating-block-all"><div class="rating-number">1607</div>
        <small>(Highest Rating 1,616)</small></div>
        <div>No. of Contests Participated: <b>49</b></div>
        '''

        self.assertEqual(
            _profile_metrics(html),
            {"codechef_rating": 1607, "codechef_max_rating": 1616, "codechef_solved": 1280, "cc_contests_attended": 49},
        )
        self.assertEqual(
            _profile_metrics("<html>Cloudflare challenge</html>"),
            {"codechef_rating": 0, "codechef_max_rating": 0, "codechef_solved": 0, "cc_contests_attended": 0},
        )

    def test_retry_delay_honors_server_window(self):
        self.assertEqual(retry_delay("3", 0), 3.0)


if __name__ == "__main__":
    unittest.main()
