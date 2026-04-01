class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }

        int first = 1;
        int second = 2;

        for (int step = 3; step <= n; ++step) {
            int current = first + second;
            first = second;
            second = current;
        }

        return second;
    }
};