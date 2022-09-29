
//先不考虑括号、乘方，只计算加减乘

function eqExp(str) {

    function symLevel(_sym) {
        switch (_sym) {
            case '*': return 1
                break
            case '/': return 1
                break
            default: return 0
                break
        }
    }
    function binaryCalc(_sym, par1, par2) {
        switch (_sym) {
            case '+': return par1 + par2
                break
            case '-': return par1 - par2
                break
            case '*': return par1 * par2
                break
            case '/': return parseInt(par1 / par2)
                break
        }
    }

    let lastAddNum = 0
    let lastTimeNum = 1
    let lastAddSym = '+'
    let lastTimeSym = '*'
    let lastLevel = 0

    let curSym = '+'
    let curNum = 0
    let strPointer = 0
    let curLevel = 0

    let answer = 0

    //开始循环
    while (curSym != '@') {

        curNum = 0
        //从字符串str读取数curNum和符号curSym
        while (strPointer < str.length && /[0-9]/.test(str[strPointer])) {
            curNum *= 10
            curNum += Number(str[strPointer])
            strPointer++
        }
        if (strPointer == str.length) curSym = '@'
        else {
            curSym = str[strPointer]
            strPointer++
        }
        //以上测试通过

        //处理这对数和符号

        if (curSym != '@') {
            //处理当前数和当前符号，但不是表达式末尾
            curLevel = symLevel(curSym)
            if (curLevel == 1) {
                lastTimeNum = binaryCalc(lastTimeSym, lastTimeNum, curNum)
                lastTimeSym = curSym
            }
            else {
                if (lastLevel == 1) {
                    curNum = binaryCalc(lastTimeSym, lastTimeNum, curNum)
                    lastTimeNum = 1
                    lastTimeSym = '*'
                }
                lastAddNum = binaryCalc(lastAddSym, lastAddNum, curNum)
                lastAddSym = curSym
            }
            lastLevel = curLevel
        }
        else {
            //结束一切乘除和加减的计算
            if (lastLevel == 1) curNum = binaryCalc(lastTimeSym, lastTimeNum, curNum)
            lastAddNum = binaryCalc(lastAddSym, lastAddNum, curNum)
            answer = lastAddNum
        }
    }
    return answer
}

console.log(eqExp("355+44*56-63"))
let testStr = "abc"
console.log(testStr.substring(0,testStr.length-1))