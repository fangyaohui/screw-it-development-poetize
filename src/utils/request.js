import axios from "axios";
import constant from "./constant";
//处理url参数
import qs from "qs";

import store from "../store";

import CryptoJS from 'crypto-js';

function encryptAES (data, secretKey) {
  const secretKeyStr = CryptoJS.enc.Utf8.parse(secretKey);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKeyStr, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64)
  };
}

const secretKey = 'Sio0J4c922So32PH'; // 确保密钥安全 
axios.defaults.baseURL = constant.baseURL;

axios.interceptors.request.use(
  config => {
    // 判断是否为POST请求且包含数据  
    if (config.method === 'post' && config.data) {
      // 加密数据  
      // alert(JSON.stringify(config.data))
      const encryptedData = encryptAES(config.data, secretKey);
      // alert(encryptedData)
      // 修改请求体为加密后的数据  
      config.data = {
        encryptedData: encryptedData.ciphertext,
        iv: encryptedData.iv
      };
      const token = localStorage.getItem('userToken');
      // 你可以在这里添加其他需要发送的头部信息，如Content-Type等  
      config.headers['Content-Type'] = 'application/json';
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['Content-Length'] = 200;
    }
    return config;
  },
  error => {
    // 处理请求错误  
    return Promise.reject(error);
  }
);


// 添加请求拦截器
axios.interceptors.request.use(function (config) {
  // 在发送请求之前做些什么
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, function (error) {
  // 对请求错误做些什么
  return Promise.reject(error);
});

// 添加响应拦截器
axios.interceptors.response.use(function (response) {
  if (response.data !== null && response.data.hasOwnProperty("code") && response.data.code !== 200) {
    if (response.data.code === 300) {
      store.commit("loadCurrentUser", {});
      localStorage.removeItem("userToken");
      store.commit("loadCurrentAdmin", {});
      localStorage.removeItem("adminToken");
      window.location.href = constant.webURL + "/user";
    }
    return Promise.reject(new Error(response.data.message));
  } else {
    return response;
  }
}, function (error) {
  // 对响应错误做点什么
  return Promise.reject(error);
});

// 当data为URLSearchParams对象时设置为application/x-www-form-urlencoded;charset=utf-8
// 当data为普通对象时，会被设置为application/json;charset=utf-8


export default {
  post (url, params = {}, isAdmin = false, json = true) {
    let config;
    if (isAdmin) {
      config = {
        headers: { "Authorization": localStorage.getItem("adminToken") }
      };
    } else {
      config = {
        headers: { "Authorization": localStorage.getItem("userToken") }
      };
    }

    return new Promise((resolve, reject) => {
      axios
        .post(url, json ? params : qs.stringify(params), config)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  get (url, params = {}, isAdmin = false) {
    let headers;
    let config;
    if (isAdmin) {
      config = {
        headers: { "Authorization": localStorage.getItem("adminToken") },
        timeout: 20000
      }
    } else {
      config = {
        headers: { "Authorization": localStorage.getItem("userToken") },
        timeout: 20
      }

    }

    return new Promise((resolve, reject) => {
      axios.get(url, {
        params: params,
        headers: headers
      }).then(res => {
        resolve(res.data);
      }).catch(err => {
        reject(err)
      })
    });
  },

  upload (url, param, isAdmin = false, option) {
    let config;
    if (isAdmin) {
      config = {
        headers: { "Authorization": localStorage.getItem("adminToken"), "Content-Type": "multipart/form-data" },
        timeout: 60000
      };
    } else {
      config = {
        headers: { "Authorization": localStorage.getItem("userToken"), "Content-Type": "multipart/form-data" },
        timeout: 60000
      };
    }
    if (typeof option !== "undefined") {
      config.onUploadProgress = progressEvent => {
        if (progressEvent.total > 0) {
          progressEvent.percent = progressEvent.loaded / progressEvent.total * 100;
        }
        option.onProgress(progressEvent);
      };
    }

    return new Promise((resolve, reject) => {
      axios
        .post(url, param, config)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  },

  uploadQiniu (url, param) {
    let config = {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000
    };

    return new Promise((resolve, reject) => {
      axios
        .post(url, param, config)
        .then(res => {
          resolve(res.data);
        })
        .catch(err => {
          reject(err);
        });
    });
  }
}
