const FindPeak = (arr = []) => {
    if(arr.length < 3) {
       return -1
    }
    const helper = (low, high) => {
       if(low > high) {
          return -1
       }
       const middle = Math.floor((low + high) / 2)
       if(arr[middle] <= arr[middle + 1]) {
          return helper(middle + 1, high)
       }
       if(arr[middle] <= arr[middle - 1]) {
          return helper(low, middle - 1)
       }
       return middle
    }
    return helper(0, arr.length - 1)
 };