(function ($) {
  //共用變數
  let map;
  let mapHelper;
  const $infoCardBlock = $("#infoCardBlock");

  let houseData;
  let facilitiesData;
  let dangerousData;
  let schoolCorrdinate;
  let houseUrl;
  let weightData;
  $(document).ready(function () {
    initMap();
  });

  /**
   * 初始化地圖物件
   */
  function initMap() {
    const initPoint = [25.04909215299172, 121.5136427113755];
    const initZoom = 7;
    //設定中心點
    map = L.map("map").setView(initPoint, initZoom);
    //設定圖層
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© OpenStreetMap <a href="https://www.openstreetmap.org/">OSM</a>',
      maxZoom: 20,
    }).addTo(map);

    //初始化地圖幫手
    mapHelper = new MapHelper(map);

    // 飛到北車
    mapHelper.flyToPoint(
      [25.04882,121.51375],
      mapHelper.zoom,
      mapHelper.flyTime
    );

    // 打圖釘
    const pin = mapHelper.createPin(
      [25.04882,121.51375],
      "台北車站",
      "<h1>台北車站</h1>",
      Icons.HOUSEICON
    );
    const pin2 = mapHelper.createPin(
        [25.048985, 121.513315],
        "台北車站2",
        "<h1>台北車站2</h1>",
        Icons.HOUSEICON
      );
    map.addLayer(pin);
    map.addLayer(pin2);


  }

  //載入資料
  function loadData(schoolName) {
    //抽出到設定
    setData(schoolName);
    //跳到學校
    mapHelper.flyToPoint(schoolCorrdinate, mapHelper.zoom, mapHelper.flyTime);

    houseUrl = `http://house.nfu.edu.tw/${schoolName}/`;
    //載入房屋資料
    loadHouseData(houseUrl, houseData);
    LoadFacilitiesData(facilitiesData);
  }

  function setData(schoolName) {
    let setting;
    switch (schoolName) {
      case "YZU":
        setting = yzuSetting;
        break;
      case "UCH":
        setting = uchSetting;
        break;
      case "CYCU":
        setting = cycuSetting;
        break;
      case "NCU":
        setting = ncuSetting;
        break;
      default:
        alert("請選擇想切換的學校");
        return;
        break;
    }

    houseData = setting.houseData;
    facilitiesData = setting.facilities;
    dangerousData = setting.dangerous;
    schoolCorrdinate = setting.coordinate;
    weightData = setting.weightData;
  }

  /**
   * 載入房屋資料
   * @param {*} url 房屋詳細資訊的url
   * @param {Array} houseData 房屋的資料
   */
  function loadHouseData(url, houseData) {
    //設定點
    for (const index in houseData) {
      const data = houseData[index];
      const latLng = [data["latitude"], data["longitude"]];
      if (
        !data["latitude"] ||
        !data["longitude"] ||
        sameLatLng(latLng, schoolCorrdinate)
      ) {
        continue;
      }

      const houseHtml = `
          <div class="card">
              <div class="card-body">
              <h5 class="card-title">
              ${data["house_id"]}-${
        data["house_title"] || data["house_desc"]
      }</h5>              
              <p class="card-text">
                  位置:${data["house_address"]}<br>
                  大小:${data["house_area"]}<br>
                  類型:${data["house_type"]}<br>
                  描述:${data["house_desc"]}<br>
                  租金:${data["rental"]}元<br>
                </p>
                <a href="
                ${url + data["house_id"]}" 
                target="_blank">查看原始租屋網站</a>
              </div>
            </div>
        `;
      const pin = mapHelper.createPin(
        latLng,
        data["house_address"],
        houseHtml,
        Icons.HOUSEICON
      );
      if (!pin) continue;

      houseFeatureGroup.addLayer(pin);

      $(pin).on("click", housePinEvent);
    }
    houseFeatureGroup.addTo(map);
  }

  /**
   * 載入事件資料
   * @param {*} pinLatLng 中心點的房屋的座標
   * @param {*} range 範圍大小
   * @param {*} eventData 事件的資料
   */
  function LoadEventOfPin(pinLatLng, range, eventData) {
    eventData.forEach((data) => {
      //算出距離
      const latlng = [data.latitude, data.longitude];
      const distance = mapHelper.distanceByLnglat(pinLatLng, latlng);
      if (distance > range) return;

      const descriptionHtml = `
          <div class="card">
              <div class="card-body">
                <h5 class="card-title">${data.danger_type}</h5>
                <p class="card-text">
                  地點:${data.address}<br>
                  描述:${data.description}<br>
                  距離:${Math.floor(distance)}公尺
                </p>
              </div>
            </div>
        `;
      let iconType = "";
      switch (data.danger_type) {
        case "自行車竊盜":
          iconType = Icons.BIKEICON;
          break;
        case "汽車竊盜":
          iconType = Icons.CARICON;
          break;
        case "住宅竊盜":
          iconType = Icons.THIEFICON;
          break;
        case "機車竊盜":
          iconType = Icons.MOTORCYCLEICON;
          break;
        case "交通事故":
          iconType = Icons.ACCIDENTICON;
          break;
        default:
          iconType = Icons.REDICON;
          break;
      }

      const eventPin = mapHelper.createPin(
        latlng,
        data.address,
        descriptionHtml,
        iconType
      );

      deleteFeatureGroup.addLayer(eventPin);

      eventArray.push({
        html: descriptionHtml,
        pin: eventPin,
        type: data.danger_type,
      });
    });
    //畫出事件區
    eventArray.forEach(function (item, index) {
      const $infoCard = $(item.html);
      $infoCardBlock.append($infoCard);
      //事件區點選會做的事情
      $infoCard.click(() => {
        //點下去會跳資訊
        eventArray[index].pin.openPopup();
        // //畫線
        // var latlngs = [pinLatLng, eventPins[index].getLatLng()];
        // let line = mapHelper.setLine(latlngs, "red");
        // deleteFeatureGroup.addLayer(line);
      });
    });
  }
  /**
   * 載入周圍設施的資料
   * @param {*} facilitiesData 設施的資料
   */
  function LoadFacilitiesData(facilitiesData) {
    facilitiesData.forEach((data) => {
      const latLng = [data.latitude, data.longitude];
      const label = mapHelper.createLabel(latLng, data.title);
      facilitiesFeatureGroup.addLayer(label);
    });

    facilitiesFeatureGroup.addTo(map);
  }

  /**
   * 對點下去的房屋，畫上到設施的直線
   * @param {*} pinLatLng 中心點的座標
   * @param {*} facilitiesData 設施的資料
   */
  function DrawLineToFacilities(pinLatLng, facilitiesData) {
    facilitiesData.forEach((data) => {
      const latLng = [data.latitude, data.longitude];
      var latlngs = [pinLatLng, latLng];
      let line = mapHelper.setLine(latlngs, "yellow");
      deleteFeatureGroup.addLayer(line);
    });
  }

  /**
   * 清除點選房屋產生的東西
   */
  function clearPinClick() {
    if (nowClickPin) {
      nowClickPin.closePopup();
      map.removeLayer(nowClickPin);
    }
    nowClickPin = null;
    eventArray = [];
    $infoCardBlock.children().remove();
    deleteFeatureGroup.clearLayers();
  }

  function sameLatLng(latlng1, latlng2) {
    if (latlng1[0] == latlng2[0] && latlng1[1] == latlng2[1]) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * 顯示前五名的資料
   * @param {*} datalist 前五名的資料
   */
  function show5TopData(datalist) {
    //檢查排除座標重複的地點
    const fiveTopList = [];
    for (let i = 0; i < datalist.length; i++) {
      const element = datalist[i];
      const latLng = [element.latitude, element.longitude];
      let flag = false;
      fiveTopList.forEach((data) => {
        const eachLatLng = [data.latitude, data.longitude];
        if (
          sameLatLng(latLng, eachLatLng) ||
          sameLatLng(latLng, schoolCorrdinate)
        ) {
          flag = true;
        }
      });
      if (
        flag === false &&
        fiveTopList.length < 5 &&
        !sameLatLng(latLng, schoolCorrdinate)
      ) {
        fiveTopList.push(element);
      }
    }
    fiveTopList.forEach((data, index) => {
      const latlng = [data.latitude, data.longitude];
      const houseHtml = `
        <div class="card">
            <div class="card-body">
              <h5 class="card-title"></h5>
              ${data["house_title"] || data["house_desc"]}</h5>
              <p class="card-text">
                位置:${data["house_address"]}<br>
                大小:${data["house_area"]}<br>
                類型:${data["house_type"]}<br>
                描述:${data["house_desc"]}<br>
                租金:${data["rental"]}元<br>
              </p>
              <a href="
              ${houseUrl + data["house_id"]}" 
              target="_blank">查看原始租屋網站</a>
            </div>
          </div>
      `;
      const pin = mapHelper.createPin(
        latlng,
        data.address,
        houseHtml,
        index + 9
      );
      $(pin).on("click", housePinEvent);
      houseFeatureGroup.addLayer(pin);
      map.addLayer(houseFeatureGroup);
    });
  }

  //事件區
  //現在點的房屋
  let nowClickPin;
  //追蹤可不可以點評分
  let ratingEnable = false;
  //存危險事件的圖標陣列
  let eventArray = [];
  //每次點選都會刪除的圖層
  let deleteFeatureGroup = new L.featureGroup();
  //房子的圖層
  let houseFeatureGroup = new L.featureGroup();
  //設施的圖層
  let facilitiesFeatureGroup = new L.featureGroup();

  //房屋點事件
  function housePinEvent(e) {
    ratingEnable = true;
    //清除所有需要被清除的
    clearPinClick();

    nowClickPin = e.target;
    let pinLatLng = [nowClickPin.getLatLng().lat, nowClickPin.getLatLng().lng];
    let range = 400;

    //畫圈圈
    searchCircle = mapHelper.setCircle(nowClickPin, range);
    deleteFeatureGroup.addLayer(searchCircle);

    //載入危險事件
    LoadEventOfPin(pinLatLng, range, dangerousData);

    //畫線到重要設施
    DrawLineToFacilities(pinLatLng, facilitiesData);

    //清除且保留點選的房屋
    map.removeLayer(houseFeatureGroup);
    nowClickPin.addTo(map).openPopup();

    //加上下次會被清除的圖層
    deleteFeatureGroup.addTo(map);
  }

  //針對 查看其他房屋的按鈕
  $("#checkAnotherHouseBtn").click(function (e) {
    nowClickPin.closePopup();
    ratingEnable = false;
    if (map.hasLayer(houseFeatureGroup)) {
      return;
    }
    //清空資訊區
    $infoCardBlock.children().remove();
    $infoCardBlock.html(` 
        <p style="text-align: center; color: white">
          請點選畫面上的租屋點查看周圍危險環境
        </p>
      `);
    deleteFeatureGroup.clearLayers();
    map.addLayer(houseFeatureGroup);
  });

  //查看詳細資訊的按鈕
  $("#ratingButton").click(function (e) {
    if (!ratingEnable) {
      alert("請先點選地圖上的房屋點，才能看詳細評分標準喔");
      return;
    }
    $("#ratingWindow").modal("show");
    //產到重要設施的字串
    let facilitieString = "<h5>附近重要設施距離:</h5>";
    facilitiesData.forEach((data) => {
      let distance = mapHelper.distanceByLnglat(
        [data.latitude, data.longitude],
        [nowClickPin.getLatLng().lat, nowClickPin.getLatLng().lng]
      );
      facilitieString += `距離 ${data.title} ${Math.floor(distance)}公尺<br>`;
    });
    let bikeThiefCount = 0,
      carThiefCount = 0,
      houseBurglaryCount = 0,
      motorcycleThief = 0,
      trafficAccidentCount = 0;
    eventArray.forEach((data) => {
      switch (data.type) {
        case "自行車竊盜":
          bikeThiefCount++;
          break;
        case "汽車竊盜":
          carThiefCount++;
          break;
        case "住宅竊盜":
          houseBurglaryCount++;
          break;
        case "機車竊盜":
          motorcycleThief++;
          break;
        case "交通事故":
          trafficAccidentCount++;
          break;
        default:
          break;
      }
    });

    let dangerousTypeString = `
      <h5>附近危險事件統計:</h5>
      自行車竊盜:${bikeThiefCount}件</br>
      汽車竊盜:${carThiefCount}件</br>
      住宅竊盜:${houseBurglaryCount}件</br>
      機車竊盜:${motorcycleThief}件</br>
      交通事故:${trafficAccidentCount}件</br>`;

    //畫到內容到window上
    $("#ratingWindowContent").html(`
        ${nowClickPin.getPopup()._content}
        ${facilitieString}</br>
        ${dangerousTypeString}
  
      `);
  });

  //設定視窗點確認
  $("#settingConfirm").click(function (e) {
    var schoolName = $("#schoolDropDown option:selected").val();
    $("#settingWindow").modal("hide");
    //清除pin點選
    clearPinClick();
    //清除設施
    map.removeLayer(facilitiesFeatureGroup);
    facilitiesFeatureGroup = new L.featureGroup();
    //清除房子
    map.removeLayer(houseFeatureGroup);
    houseFeatureGroup = new L.featureGroup();

    loadData(schoolName);
  });
})($);
