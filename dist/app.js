function BattleCenter() {
    this.listeners = new Map();
    this.roomOwner = false;
}

BattleCenter.prototype.emit = function (msgId, message, dispatchToSelf) {
    // 发送到服务端，即广播出去
    // this.fakeServer(msgId,message);
    if (dispatchToSelf) {
        this.dispatchMessage(msgId, message);
    }
    lanbridge.broadcastMessage(JSON.stringify({
        "msgId": msgId,
        "message": message
    }));
};

BattleCenter.prototype.fakeServer = function (msgId, message) {
    console.log("fakserver receive msgId:" + msgId + ",message:" + message);
    if (msgId == "chat message") {
        this.dispatchMessage(msgId, message);
        setTimeout(() => {
            this.dispatchMessage('chat message', { 'place': message.place + 1, 'player': !message.player });
        }, 1000);
    } else if (msgId == "login") {
        var loginRspMsg = Object.assign(message, { role: true });
        console.log("login resp:" + loginRspMsg);
        this.dispatchMessage("role", loginRspMsg);
    }
};

BattleCenter.prototype.dispatchMessage = function (msgId, message) {
    var callback = this.listeners.get(msgId);
    if (callback != undefined) {
        callback(message);
    }
};

BattleCenter.prototype.on = function (msg, callback) {
    this.listeners.set(msg, callback);
};

function onPushData(data) {
    var json = JSON.parse(data);
    var msgId = json.msgId;
    var message = json.message;
    if (msgId == "chat message") {
        socket.dispatchMessage(msgId, message);
    }
}

function onReceiveLBEvent(eventId, data) {
    console.log("onReceiveLBEvent:" + eventId + ",data:" + data);
    if (eventId == 1) {
        // disconnect from server
    } else if (eventId == 2) {
        // server stop
    } else if (eventId == 3) {
        // server receive client disconnect event
    } else if (eventId == 4) {
        onPushData(data);
    }
}

function onCreateRoomResult(result) {
    startScreen.style.display = 'none';
    battleScreen.style.display = 'block';
    ReactDOM.render(React.createElement(Board, null), wrap);
    socket.roomOwner = true;
    // socket.emit('login',{'userName':"风清扬"});

    var loginRspMsg = Object.assign({ 'userName': "风清扬" }, { role: true });
    console.log("onCreateRoomResult login resp:" + loginRspMsg);
    socket.dispatchMessage("role", loginRspMsg);
}

function onJoinRoomResult(result) {
    startScreen.style.display = 'none';
    battleScreen.style.display = 'block';
    ReactDOM.render(React.createElement(Board, null), wrap);
    socket.roomOwner = false;
    resetBtn.style.display = "none";
    // socket.emit('login',{'userName':"风清扬"});

    var loginRspMsg = Object.assign({ 'userName': "扬清风" }, { role: false });
    console.log("onJoinRoomResult login resp:" + loginRspMsg);
    socket.dispatchMessage("role", loginRspMsg);
}

var wrap = document.getElementById('wrap');
var battleScreen = document.getElementById("battleScreen");
var startScreen = document.getElementById('startScreen');
var socket = new BattleCenter();
var createRoomBtn = document.getElementById('createRoom');
var resetBtn = document.getElementById('resetBtn');
resetBtn.style.top = getResetBtnTop();
var currentTurn = document.getElementById("currentTurn");
currentTurn.style.top = getCurrentTurnTop();
updateCurrentTurn(true);
createRoomBtn.onclick = function () {
    lanbridge.startCreateRoom("onCreateRoomResult");
    // onCreateRoomResult("")
};
var joinRoomBtn = document.getElementById('joinRoom');
joinRoomBtn.onclick = function () {
    lanbridge.startJoinRoom("onJoinRoomResult");
};
// value.focus();
// value.onkeydown = function(e){
// e = e || event;
// if (e.keyCode === 13 && this.value) {
//     login.style.display='none';
//     wrap.style.display='block';
//     socket=new BattleCenter();
//     ReactDOM.render(<Board />,
//     document.getElementById('wrap'))
//     socket.emit('login',{'userName':this.value});
// }
// }

function Unit(props) {
    return React.createElement("div", { className: props.style, style: getStyle(props.style, props.pos), onClick: () => props.onClick() });
}

function getStyle(styleName, key) {
    if (styleName == "unit") {
        return getUnitStyle(key);
    } else if (styleName == "unit unit-b") {
        return getUnitBStyle(key);
    } else if (styleName == "unit unit-w") {
        return getUnitWStyle(key);
    }
    console.log("cannot get style :" + styleName);
    var pos = getUnitPosition(key);
    var size = getUnitSize();
    return { left: pos[0] + "px", top: pos[1] + "px", width: size + "px", height: size + "px" };
}

// 获取棋子大小
function getPieceSize() {
    return 25 / 535 * getBoardWidth();
}

function getUnitWStyle(key) {
    var size = getUnitSize();
    var bgSize = getPieceSize();
    var pos = getUnitPosition(key);
    console.log(pos);
    return { left: pos[0] + "px", top: pos[1] + "px", width: size + "px", height: size + "px", backgroundSize: bgSize + "px" };
}

function getUnitBStyle(key) {
    var size = getUnitSize();
    var bgSize = getPieceSize();
    var pos = getUnitPosition(key);
    console.log(pos);
    return { left: pos[0] + "px", top: pos[1] + "px", width: size + "px", height: size + "px", backgroundSize: bgSize + "px" };
}

function getUnitStyle(key) {
    var size = getUnitSize();
    var pos = getUnitPosition(key);
    return { left: pos[0] + "px", top: pos[1] + "px", width: size + "px", height: size + "px" };
}

function getUnitPosition(key) {
    var row = key[0];
    var column = key[1];

    var realSize = getBoardWidth() / 15;

    var padding = getBoardPadding();

    var left = padding + realSize * column;
    var top = padding + realSize * row;

    return [left, top];
}

function getBoardPadding() {
    return 5 / 535 * getBoardWidth();
}

function getBoardWidth() {
    return document.body.clientWidth * 0.9;
}

function getUnitSize() {
    var size = getBoardWidth() / 15;
    return Math.floor(size);
}

function getResetBtnTop() {
    return document.body.clientHeight / 2 + getBoardWidth() / 2 + 25 + "px";
}
function getCurrentTurnTop() {
    return document.body.clientHeight / 2 - getBoardWidth() / 2 - 50 + "px";
}

function onReset() {
    socket.emit('reset', { "turn": socket.roomOwner }, true);
}

function updateCurrentTurn(isBlacksTurn) {
    if (isBlacksTurn) {
        currentTurn.innerHTML = "当前执棋：黑棋";
    } else {
        currentTurn.innerHTML = "当前执棋：白棋";
    }
}

//在线人数
// function OnlinePlayer(props){
//   let arr=[];
//   for(let key in props.online){
//      arr.push(props.online[key]);
//   }
//    return(
//          <div className='online'> 
//               {arr.map(function(value,index){

//                     if(value.hasOwnProperty('role') && value.role){
//                          return <div key={index} className='clearfix'>

//                                     <Unit style='unit unit-b' />
//                                     <div className='fl'>{value.userName}</div>
//                                 </div>
//                     }else if(value.hasOwnProperty('role') && !value.role){
//                          return  <div key={index} className='clearfix'>

//                                     <Unit style='unit unit-w' />
//                                     <div className='fl'>{value.userName}</div>
//                                 </div>
//                     }else{
//                          return  <p key={index}>{value.userName} ：在观战</p>
//                     }
//               })
//            }
//         </div>
//     )
// }
//主棋盘
class Board extends React.Component {
    constructor() {
        super();
        this.state = {
            'styleArr': Array(225).fill('unit'),
            isBlacksTurn: true,
            point: -1,
            urBlack: null,
            online: {}
        };
    }
    componentWillMount() {
        var that = this;
        socket.on('role', function (msg) {
            if (msg.hasOwnProperty('role') && msg.role) {
                that.setState({ urBlack: true });
                console.log('你是黑旗');
            } else if (msg.hasOwnProperty('role') && !msg.role) {
                that.setState({ urBlack: false });
                console.log('你是bai旗');
            } else {
                console.log('人满了，不好意思');
            }
        });
        socket.on('online', function (user) {
            that.setState({ online: user });
        });
    }
    componentDidMount() {
        var that = this;
        socket.on('chat message', function (msg) {
            //更新视图
            const styleArray = that.state.styleArr.slice();
            styleArray[msg.place] = that.state.isBlacksTurn ? 'unit unit-b' : 'unit unit-w';
            updateCurrentTurn(!that.state.isBlacksTurn);
            that.setState({
                'styleArr': styleArray,
                isBlacksTurn: !that.state.isBlacksTurn,
                point: msg.place
            });
        });
        socket.on('reset', function (msg) {
            console.log('reset');
            const styleArray = that.state.styleArr.slice();
            styleArray.fill('unit');
            that.setState({
                'styleArr': styleArray,
                point: -1
            });
            ReactDOM.render(React.createElement("div", null), document.getElementById('gameover'));
            updateCurrentTurn(msg.turn);
            if (msg.turn) {
                alert("it's black's turn");
            } else {
                alert("it's white's turn");
            }
        });
    }
    handle(n) {

        //刚落子的加个css3特效
        //
        //
        //
        //   let num=0;
        //   for(let i in this.state.online){
        //         num++;
        //   }
        //   if(num<2){
        //     alert('请等待partner')
        //     return 
        //   }
        //判断该谁落子
        if (this.state.isBlacksTurn == this.state.urBlack) {
            if (this.state.styleArr[n] != 'unit') {
                //如果落子的地方有子了，就骂他
                alert('那有棋子了，放到别处吧');
                return;
            }
            socket.emit('chat message', { 'place': n, 'player': this.state.isBlacksTurn }, true);
        } else {
            alert('不该你走呢亲');
        }
    }
    componentDidUpdate() {
        // 更新的时候触发
        if (calculateWinner(this.state.styleArr, this.state.point)) {
            if (this.state.isBlacksTurn != this.state.urBlack && this.state.urBlack != null) {
                ReactDOM.render(React.createElement("img", { src: "img/victory.png", className: "victory" }), document.getElementById('gameover'));
            } else {
                ReactDOM.render(React.createElement("img", { src: "img/defeat.png", className: "victory" }), document.getElementById('gameover'));
            }
        }
    }
    render() {

        let board = [];
        for (let r = 0; r < 15; r++) {
            for (let i = 0; i < 15; i++) {
                board[r * 15 + i] = React.createElement(Unit, { key: [r, i], pos: [r, i], style: this.state.styleArr[r * 15 + i], onClick: () => this.handle(r * 15 + i) });
            }
        }
        return React.createElement(
            "div",
            null,
            board,
            React.createElement("div", { id: "gameover" })
        );
    }
}

function calculateWinner(arr, num) {
    var target = arr[num];
    var line = 1;
    var upSide, leftUp, rightUp;
    upSide = leftUp = rightUp = Math.min(Math.floor(num / 15), 5);
    //横向判断先向左后向右
    var leftSide = Math.min(num % 15, 5);
    var rightSide = Math.min(14 - num % 15, 5);
    //console.log('rightSide',rightSide)
    for (let i = num - 1; i > num - leftSide - 1; i--) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    for (let i = num + 1; i <= num + rightSide; i++) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    if (line == 5) {
        return true;
    } else {
        line = 1;
    }
    //竖向判断 先上后下
    for (let i = num - 15; i >= num - upSide * 15; i = i - 15) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    var downSide = 15 - upSide;
    for (let i = num + 15; i <= num + downSide * 15; i = i + 15) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    if (line == 5) {
        return true;
    } else {
        line = 1;
    }
    //   斜向判断  酱紫/斜   先上后下

    rightUp = Math.min(rightUp, rightSide); //判断太靠右边了，就被右边界隔断
    for (let i = num - 14; i >= num - rightUp * 14; i = i - 14) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    var leftDown, rightDown;
    rightDown = leftDown = 14 - Math.floor(num / 15);
    leftDown = Math.min(leftDown, leftSide); //判断太靠左边了，就被左边界隔断
    for (let i = num + 14; i <= num + leftDown * 14; i = i + 14) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    if (line == 5) {
        return true;
    } else {
        line = 1;
    }
    //   斜向判断   酱紫\斜   先上后下
    rightUp = Math.min(rightUp, leftSide);
    for (let i = num - 16; i >= num - rightUp * 16; i = i - 16) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    rightDown = Math.min(rightDown, rightSide);
    for (let i = num + 16; i <= num + rightDown * 16; i = i + 16) {
        if (arr[i] == target) {
            line++;
        } else {
            break;
        }
    }
    if (line == 5) {
        return true;
    } else {
        line = 1;
    }

    return false;
}
//# sourceMappingURL=app.js.map
