#include <vector>
#include <unordered_map>
using namespace std;

class Solution
{
public:
    vector<int> twoSum(const vector<int> &nums, int target)
    {

        unordered_map<int, int> map;

        for (int i = 0; i < nums.size(); i++)
        {
            int dif = target - nums[i];

            if (map.find(dif) != map.end())
            {
                return {map[dif], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};
