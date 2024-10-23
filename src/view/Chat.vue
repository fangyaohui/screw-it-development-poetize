<template>

  <div id="app">

    <div class="main1">
      .
    </div>

    <div class="main">

      <div class="contact">
        <div class="top">
          <div class="left">
            <img class="avatar" src="" alt="" />
          </div>

          <div class="right">
            {{ user.username }}
          </div>


          <!-- 添加好友按钮 -->
          <button @click="showModal = true" class="add-friend-button">Add Friend</button>

          <!-- 弹出的小页面（模态框） -->
          <div v-if="showModal" class="modal">
            <div class="modal-content">
              <div class="modal-header">
                <h2>Add a Friend</h2>
                <span @click="showModal = false" class="close">&times;</span>
              </div>

              <!-- 搜索框 -->
              <div class="search-section">
                <input v-model="searchQuery" type="text" placeholder="Search by username or phone number"
                  class="search-input" @keyup.enter="searchFriends" />
              </div>

              <!-- 搜索结果展示 -->
              <div class="friend-list">
                <div v-for="friend in filteredFriends" :key="friend.id" class="friend-item">
                  <div class="friend-avatar">
                    <img :src="friend.avatar" :alt="friend.username" />
                  </div>
                  <div class="friend-info">
                    <div class="friend-name">{{ friend.username }}</div>
                    <button @click="addFriend(friend)" class="add-button">Add</button>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>

        <div v-if="friends.length" class="bottom">
          <div v-for="(friend, i) in friends" class="friend" :class="{activeColor: isActive(i)}"
            @click="selectFriend(friend)">
            <div class="left">
              <img class="avatar" src="" alt="" />
            </div>
            <div class="right">
              {{ friend.userBName }}
            </div>
          </div>
        </div>

        <div v-else class="info">
          <div class="msg">
            还没有好友~~~
          </div>
        </div>
      </div>



      <div v-if="selectedFriend" class="dialog">
        <div class="top1">
          <div class="name">
            {{ selectedFriend.userBName }}
          </div>
        </div>
        <div class="middle" @mouseover="over" @mouseout="out">
          <div v-if="msgList.length">
            <div v-for="msg in msgList">
              <div class="msg"
                :style="msg.sendUser === selectedFriend.userB ? 'flex-direction: row;' : 'flex-direction: row-reverse;'">
                <div class="avatar">
                  <img alt="" src="" />
                </div>
                <div v-if="msg.sendUser === selectedFriend.userB" style="flex: 13;">
                  <div class="bubble-msg-left" style="margin-right: 75px;">
                    {{ msg.message }}
                  </div>
                </div>
                <div v-else style="flex: 13;">
                  <div class="bubble-msg-right" style="margin-left: 75px;">
                    {{ msg.message }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="line"></div>
        <div class="bottom">
          <label>
            <textarea class="messageText" maxlength="256" v-model="msg" :placeholder="hint"
              @keydown.enter="sendMsg($event)"></textarea>
          </label>
          <button class="send" :class="{emptyText: isEmptyText}" title="按下 ENTER 发送" @click="sendMsg()">发送</button>
        </div>
      </div>
      <div v-else class="info">
        <div class="msg">
          找个好友聊天吧~~~
        </div>
      </div>

    </div>
  </div>

</template>

<script>
  export default {
    data () {
      return {
        showModal: false,   // 控制模态框的显示与隐藏
        searchQuery: '',    // 搜索框的输入内容
        msg: '',
        friends: [],
        selectedFriend: null,
        chatHistory: [],
        newMessage: '',
        websocket: null,
        hint: '',
        bubbleMsg: '',
        interval: null,
        isEmptyText: true,
        msgList: [],
        filteredFriends: [] // 搜索到的好友
      };
    },
    computed: {
      user () {
        return JSON.parse(localStorage.getItem('currentUser'))
      }
    },
    watch: {
      msgList () {
        const mid = document.querySelector('.middle')
        this.$nextTick(() => {
          mid && (mid.scrollTop = mid.scrollHeight)
          document.querySelector('.messageText').focus()
        })
      },
      msg () {
        this.isEmptyText = !this.msg
      }
    },
    methods: {
      searchFriends () {

        // 模拟通过用户名或电话号码搜索好友
        // alert(this.searchQuery);
        this.$http.get(this.$constant.baseURL + "/upm/user/getUserByUserNameOrEmail/" + this.searchQuery)
          .then((res) => {
            if (!this.$common.isEmpty(res.data)) {
              this.filteredFriends = res.data;
              // alert(JSON.stringify(res.data));
            }
          })
          .catch((error) => {
            this.$message({
              message: error.message,
              type: "error"
            });
          });
        // alert(JSON.stringify(this.friends))
        // this.filteredFriends = this.friends.filter(friend =>
        //   friend.name.toLowerCase().includes(this.searchQuery.toLowerCase())
        // );
      },
      addFriend (friend) {
        alert(`Friend request sent to ${friend.username}`);

        this.$http.post(this.$constant.baseURL + "/chat/addFriend", {
          "id": friend.id
        })
          .then((res) => {
            alert("添加成功");
          })
          .catch((error) => {
            this.$message({
              message: error.message,
              type: "error"
            });
          });

        // 执行添加好友的逻辑
      },
      over () {
        this.setColor('#c9c7c7')
      },
      out () {
        this.setColor('#0000')
      },
      setColor (color) {
        document.documentElement.style.setProperty('--scroll-color', `${color}`)
      },

      getFriends () {
        this.$http.get(this.$constant.baseURL + "/chat/getFriendsListById")
          .then((res) => {
            if (!this.$common.isEmpty(res.data)) {
              // alert(JSON.stringify(res.data))
              this.friends = res.data
            }
          })
          .catch((error) => {
            this.$message({
              message: error.message,
              type: "error"
            });
          });
      },
      selectFriend (friend) {
        this.selectedFriend = friend;
        this.loadChatHistory(friend);
      },
      loadChatHistory (friend) {
        // Load chat history logic, currently mock data
        // alert(JSON.stringify(friend));
        this.$http.post(this.$constant.baseURL + "/chat/message/getMessage", friend)
          .then((res) => {
            if (!this.$common.isEmpty(res.data)) {
              this.msgList = res.data;
              // alert(JSON.stringify(this.msgList))
            }
          })
          .catch((error) => {
            this.$message({
              message: error.message,
              type: "error"
            });
          });


      },
      sendMsg (e) {
        if (e) {
          e.preventDefault()
        }
        if (!this.msg) {
          this.hint = '信息不可为空！'
          return
        }

        let entity = {
          sendUser: JSON.parse(localStorage.getItem('currentUser')).id,
          receiveUser: this.selectedFriend.userB,
          message: this.msg.trim(),
          // time: new Date()
        }



        this.websocket.send(JSON.stringify(entity))
        var ha = JSON.stringify(entity);
        this.msgList.push(entity);
        this.msg = ''
        this.hint = ''
      }
      ,
      sendMessage () {
        if (this.newMessage.trim() === '') return;

        const message = { content: this.newMessage, isMine: true };
        this.chatHistory.push(message);

        let entity = {
          sendUser: JSON.parse(localStorage.getItem('currentUser')).id,
          receiveUser: this.selectedFriend.userB,
          message: this.newMessage.trim(),
          // time: new Date()
        }

        this.websocket.send(JSON.stringify(entity)); // Send message through WebSocket
        this.newMessage = '';
      },
      setupWebSocket () {
        // this.socket = new WebSocket(`ws://localhost:56281/websocket/${JSON.parse(localStorage.getItem('currentUser')).id}`)
        this.websocket = new WebSocket(`ws://localhost:56281/websocket/${JSON.parse(localStorage.getItem('currentUser')).id}`);

        this.websocket.onmessage = (event) => {


          // var data = JSON.parse(event.data);
          // if (data.receiveUser == localStorage.getItem('currentUser').id) {
          //   $("#content").append(`<div style="width: 500px;height:40px;line-height: 30px;"><p style="float:right;margin:0;padding:0;">我：${data.message}</p></div>`);
          // } else {
          //   $("#content").append(`<div style="width: 500px;height:40px;line-height: 30px;"><p style="float:left;margin:0;padding:0;">${data.userId}：${data.message}</p></div>`);
          // }


          // alert(JSON.stringify(event.data));
          const receivedMessage = JSON.parse(event.data);
          this.msgList.push(receivedMessage);
          // alert(JSON.stringify(receivedMessage));
          // this.chatHistory.push({ content: receivedMessage.message, isMine: false });
        };
        // this.socket();
      },
      // socket () {
      //   websocket.onopen = function (params) {
      //     console.log('客户端连接成功')
      //   };

      //   websocket.onmessage = function (e) {
      //     // var data = JSON.parse(e.data);
      //     // if (data.userId == $("#myUserId").val()) {
      //     //   $("#content").append(`<div style="width: 500px;height:40px;line-height: 30px;"><p style="float:right;margin:0;padding:0;">我：${data.message}</p></div>`);
      //     // } else {
      //     //   $("#content").append(`<div style="width: 500px;height:40px;line-height: 30px;"><p style="float:left;margin:0;padding:0;">${data.userId}：${data.message}</p></div>`);
      //     // }
      //   };

      //   websocket.onclose = function (evt) {
      //     console.log("关闭客户端连接");
      //   };

      //   websocket.onerror = function (evt) {
      //     console.log("连接失败了");
      //   };
      // },
      setContact (index) {
        this.active = index
        delete this.friendList[index].password
        this.$emit('set-contact', this.friendList[index])
      },
      isActive (index) {
        return this.active === index
      }
    },
    mounted () {
      this.setupWebSocket();
      this.getFriends();
    },
  };
</script>

<style scoped>
  .contact {
    width: 360px;
    height: 100%;
    float: left;
    border-right: #d0d0d0 1px solid;
  }

  .top {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    border-bottom: #e0dfdf 1px solid;
  }

  .activeColor {
    background-color: #c9cbcb;
  }

  .top .left {
    flex: 1;
    text-align: center;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 4px;
  }

  .top .right {
    flex: 3;
    color: black;
    /* 设置字体颜色为黑色 */
  }

  .friend {
    width: 360px;
    height: 60px;
    line-height: 60px;
    display: flex;
    align-items: center;
    border-bottom: #faf7f7 1px solid;
  }

  .friend .left {
    flex: 1;
    margin-top: 24px;
    text-align: center;
  }

  .friend .right {
    flex: 3;
    color: #575454;
    font-size: 14px;
    color: black;
    /* 设置字体颜色为黑色 */
  }

  .friend .avatar {
    width: 36px;
    height: 36px;
  }

  .info {
    margin-top: 230px;
  }

  .info .msg {
    text-align: center;
  }

  #app {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-image: url("../assets/img/chat-bg.jpg");
  }

  .main {
    width: 1080px;
    height: 648px;
    margin-top: 72px;
    margin-left: auto;
    margin-right: auto;
    border-radius: 5px;
    background-color: #efeded;
    border: #d0d0d0 1px solid;
    box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04);
    /* 新增的 Flexbox 样式 */
    display: flex;
    /* 启用 Flexbox 布局 */
    flex-direction: row;
    /* 水平方向排列子元素 */
    justify-content: space-between;
    /* 子元素间的距离自动分配，或根据需要调整 */
  }

  :root {
    --scroll-color: #0000;
  }

  .dialog {
    width: 719px;
    height: 100%;
    float: right;
  }

  .name {
    position: relative;
    top: 22px;
    left: 25px;
  }

  .info {
    width: 719px;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .info .msg {
    flex: 1;
    text-align: center;
  }

  .top1 {
    width: 100%;
    height: 60px;
    border-bottom: #d0d0d0 1px solid;
  }

  .top1::after {
    content: " ";
    float: right;
    position: relative;
    top: 40px;
    border: 4px solid #0000;
    border-top-color: #8e9292;
  }

  .middle {
    height: 432px;
    overflow: auto;
    padding: 10px;
    margin: 6px 0 11px 0;
  }

  .middle::-webkit-scrollbar {
    width: 8px;
    height: 1px;
  }

  .middle::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background-color: var(--scroll-color);
  }

  .middle::-webkit-scrollbar-track {
    background: #efeded;
    border-radius: 4px;
  }

  .middle .msg {
    display: flex;
  }

  .avatar {
    margin: 8px;
    flex: 1;
  }

  .avatar img {
    width: 36px;
    height: 36px;
    border-radius: 4px;
  }

  .bubble-msg-left,
  .bubble-msg-right {
    padding: 10px;
    font-size: 14px;
    margin-top: 10px;
    line-height: 24px;
    border-radius: 5px;
    width: fit-content;
    line-break: anywhere;
  }

  .bubble-msg-left {
    float: left;
    color: black;
    margin-left: -12px;
    text-indent: -0.5em;
    background-color: white;
  }

  .bubble-msg-right {
    float: right;
    color: white;
    background-color: #1e6ee1;
  }

  .bubble-msg-right::before {
    content: " ";
    float: right;
    position: relative;
    left: 18px;
    border: 4px solid #0000;
    border-left-color: #1e6ee1;
  }

  .bubble-msg-left::before {
    content: " ";
    float: left;
    position: relative;
    left: -18px;
    border: 4px solid #0000;
    border-right-color: white;
  }

  .line {
    width: 100%;
    height: 0;
    position: relative;
    top: -6px;
    border-top: #d0d0d0 1px solid;
  }

  .dialog .bottom {
    padding-left: 10px;
    padding-right: 25px;
  }

  .messageText {
    position: relative;
    margin-right: 2px;
    font: 14px/1.5 Helvetica, Arial, Tahoma, 微软雅黑;
    width: 100%;
    height: 106px;
    outline: none;
    background: #efeded;
    border: 0 none;
    overflow-y: auto;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    resize: none;
    vertical-align: middle;
    display: inline-block;
  }

  .dialog .bottom::after {
    content: " ";
    float: right;
    position: relative;
    top: -121px;
    left: 75px;
    border: 4px solid #0000;
    border-bottom-color: #8e9292;
  }

  .send {
    float: right;
    position: relative;
    top: -20px;
    left: 10px;
    background-color: #51a5e6;
    border: #87ceeb;
    color: #fff;
    font-size: 12px;
    width: 50px;
    height: 22px;
    border-radius: 3px;
  }

  .send:focus {
    outline: none;
  }

  .emptyText {
    background-color: #d0d0d0;
  }

  .name {
    color: black;
    /* 设置字体颜色为黑色 */
  }




  /* 主体按钮样式 */
  .add-friend-button {
    padding: 10px 20px;
    background-color: #007bff;
    color: white;
    font-size: 18px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .add-friend-button:hover {
    background-color: #0056b3;
  }

  /* 模态框背景 */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* 模态框内容 */
  .modal-content {
    background-color: #fff;
    padding: 20px;
    border-radius: 15px;
    width: 400px;
    max-width: 100%;
    box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.2);
  }

  /* 模态框头部 */
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 24px;
    font-family: 'KaiTi', serif;
  }

  .close {
    cursor: pointer;
    font-size: 24px;
  }

  /* 搜索框样式 */
  .search-input {
    width: 100%;
    padding: 10px;
    border: 2px solid #ccc;
    border-radius: 10px;
    font-size: 18px;
    margin-bottom: 20px;
  }

  /* 好友列表样式 */
  .friend-list {
    display: flex;
    flex-direction: column;
  }

  /* 单个好友项 */
  .friend-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 10px;
  }

  .friend-avatar img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 15px;
  }

  .friend-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .friend-name {
    font-size: 18px;
    font-family: 'KaiTi', serif;
  }

  /* 添加好友按钮 */
  .add-button {
    padding: 8px 15px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }

  .add-button:hover {
    background-color: #218838;
  }
</style>