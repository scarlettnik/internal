"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Popup,
  Polygon,
} from "react-leaflet";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import "leaflet/dist/leaflet.css";
import styles from "./card.module.css";
import { Eye, EyeClosed } from "lucide-react";
import { ClockLoader } from "react-spinners";

const arrowHead = (latlng1, latlng2) => {
  if (!latlng1 || !latlng2 || latlng1.length < 2 || latlng2.length < 2) {
    console.error(latlng1, latlng2);
    return null;
  }

  const angle = Math.atan2(latlng2[1] - latlng1[1], latlng2[0] - latlng1[0]);
  const headLength = 0;
  return [
    [
      latlng2[0] - headLength * Math.cos(angle - Math.PI / 6),
      latlng2[1] - headLength * Math.sin(angle - Math.PI / 6),
    ],
    latlng2,
    [
      latlng2[0] - headLength * Math.cos(angle + Math.PI / 6),
      latlng2[1] - headLength * Math.sin(angle + Math.PI / 6),
    ],
  ];
};

const Card = () => {
  const [selectedYear, setSelectedYear] = useState();
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [year, setYear] = useState(2024);
  const [hiddenYears, setHiddenYears] = useState(new Set());
  const [hiddenYears2, setHiddenYears2] = useState(new Set());
  const [years, setYears] = useState([]);
  const [locations, setLocations] = useState([]);
  const [updateLocations, setUpdateLocations] = useState([]);
  const [position, setPosition] = useState([55.7558, 37.6173]);
  const [fileName, setFileName] = useState("");
  const mapRef = useRef(null);
  const [addYear, setAddYear] = useState("");
  const [children, setChildren] = useState(0);
  const [adultsWithCar, setAdultsWithCar] = useState(0);
  const [adultsWithoutCarsharing, setAdultsWithoutCarsharing] = useState(0);
  const [adultsWithoutCar, setAdultsWithoutCar] = useState(0);
  const [pensioners, setPensioners] = useState(0);
  const [buildings, setBuildings] = useState([]);
  const [hotPoint, setHotPoint] = useState([]);
  const [selectedConnectionData, setSelectedConnectionData] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const handleYearClick = (year) => {
    setSelectedYear(year);
  };

  useEffect(() => {
    if (years.length > 0) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years]);

  const toggleVisibility = (year) => {
    setHiddenYears((prevHidden) => {
      const newHidden = new Set(prevHidden);
      if (newHidden.has(year)) {
        newHidden.delete(year);
      } else {
        newHidden.add(year);
      }
      return newHidden;
    });
  };

  const toggleVisibility2 = (year) => {
    setHiddenYears2((prevHidden2) => {
      const newHidden2 = new Set(prevHidden2);
      if (newHidden2.has(year)) {
        newHidden2.delete(year);
      } else {
        newHidden2.add(year);
      }
      return newHidden2;
    });
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);

    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const paramSubmit = async (event) => {
    setLoading3(true)

    event.preventDefault();
    const data = {
      user_id: token,
      year: addYear,
      parameters: {
        children_percentage: children,
        retiree_percentage: pensioners,
        adult_personal_transport_percentage: adultsWithCar,
        adult_public_transport_percentage: adultsWithoutCar,
        adult_other_percentage: adultsWithoutCarsharing,
      },
    };

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_DOMAIN + "/api/v1/graph/regenerate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`${response.statusText}`);
      }

      const responseData = await response.json();
      console.log(responseData);
      setLoading3(false)

      setLocations((prevLocations) => [
        ...prevLocations,
        ...responseData.nodes,
      ]);
      setSelectedYear(null);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const existingToken = Cookies.get("userToken");
    if (!existingToken) {
      const newToken = uuidv4();
      Cookies.set("userToken", newToken, { expires: 365 });
      setToken(newToken);
      fetchData(newToken);
    } else {
      setToken(existingToken);
      fetchData(existingToken);
    }
  }, []);

  const fetchData = async (userId) => {
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_DOMAIN}/api/v1/uploads`,
        {
          method: "POST",
          headers: {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      const extractedYears = Array.from(
        new Set(data.graphs.map((item) => item.year))
      );

      setYears(extractedYears);
      setUpdateLocations(data.graphs.flatMap((item) => item.update_nodes));
      setLocations(data.graphs.flatMap((item) => item.nodes));
      const buildings =
        data.graphs.length > 0
          ? data.graphs[data.graphs.length - 1].buildings
          : [];
      setBuildings(buildings);
      console.log(data.position);
      if (mapRef.current) {
        mapRef.current.flyTo(data.position, 18);
      }
    } catch (error) {
      console.error(error);
    }
  };

  console.log(position);

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("Файл:", file ? file.name : "Не выбран");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", token);
    formData.append("year", year);

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_DOMAIN + "/api/v1/graph",
        {
          method: "POST",
          headers: { "ngrok-skip-browser-warning": "true" },
          body: formData,
        }
      );

      const responseData = await response.json();
      console.log(responseData);

      setYears((prevYears) => {
        if (!prevYears.includes(responseData.year)) {
          return [...prevYears, responseData.year];
        }
        return prevYears;
      });

      setLocations((prevLocations) => [
        ...prevLocations,
        ...responseData.nodes,
      ]);

      setUpdateLocations((prevLocations) => [
        ...prevLocations,
        ...responseData.update_nodes,
      ]);
    } catch (error) {
      console.error(error);
    }
  };
  const showAllYears = () => {
    setSelectedYear(null);
  };

  console.log(selectedConnectionData);

  const getColorFromLoadPercentageAndYear = (loadPercentage, year) => {
    const clampedValue = Math.max(0, Math.min(100, loadPercentage));
    const red = Math.floor((clampedValue / 100) * 255);
    const green = Math.floor((1 - clampedValue / 100) * 255);
    const brightnessFactor = Math.max(
      0,
      1 - (years[years.length - 1] - year) * 0.4
    );
    const adjustedRed = Math.floor(red * brightnessFactor);
    const adjustedGreen = Math.floor(green * brightnessFactor);

    return `rgb(${adjustedRed}, ${adjustedGreen}, 0)`;
  };

  return (
    <div style={{ width: "100%", display: "flex" }}>
      <div style={{ width: "25%" }}>
        <div className={styles.container}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3 className={styles.title}>Загрузите новый граф</h3>
            <div className={styles.formGroup}>
              <label>
                Укажите год
                <br></br>
                <input
                  className={styles.input}
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.feedback} htmlFor="file">
                {fileName || "Выберите ZIP-файл:"}
              </label>
              <input
                className={styles.feedfile}
                type="file"
                id="file"
                accept=".zip"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <button type="submit" className={styles.button}>
                Отправить
              </button>
            </div>
          </form>
          <div></div>
          <div className={styles.buttonContainer}>
            <div className={styles.buttonWrapper}>
              {years.length > 0 ? (
                <button
                  onClick={showAllYears}
                  className={`${styles.yearButton} ${
                    selectedYear == null ? styles.active : ""
                  }`}
                  style={{ marginRight: "38px" }}
                >
                  Данные за все годы
                </button>
              ) : (
                <>После добавления здесь появятся данные</>
              )}
            </div>
            {years.map((year) => (
              <div key={year} className={styles.buttonWrapper}>
                <button
                  onClick={() => handleYearClick(year)}
                  className={`${styles.yearButton} ${
                    selectedYear === year ? styles.active : ""
                  }`}
                >
                  {year}
                </button>
                <div className={styles.buttonContainer}>
                  <button
                    onClick={() => toggleVisibility(year)}
                    className={`${styles.toggleButton} ${
                      hiddenYears.has(year) ? styles.hidden : ""
                    }`}
                  >
                    {hiddenYears.has(year) ? <EyeClosed /> : <Eye />}{" "}
                    Изначальный
                  </button>
                  <button
                    style={{ marginLeft: "20%" }}
                    onClick={() => toggleVisibility2(year)}
                    className={`${styles.toggleButton} ${
                      hiddenYears2.has(year) ? styles.hidden : ""
                    }`}
                  >
                    {hiddenYears2.has(year) ? <EyeClosed /> : <Eye />}{" "}
                    Улучшенный
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ width: "45%" }}>
        <div>
          <MapContainer
            center={[55.7558, 37.6173]}
            zoom={15}
            style={{ height: "100vh" }}
            ref={mapRef}
            attributionControl={false} 
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {locations &&
              locations.map((location) =>
                location.connections.map((connection) => {
                  const isSelectedYear = selectedYear === connection.year;
                  const isHidden = hiddenYears.has(connection.year);
                  if ((isSelectedYear || !selectedYear) && !isHidden) {
                    const connectedLocation = locations?.find(
                      (loc) => loc.id === connection.id
                    );
                    const points = arrowHead(
                      location?.position,
                      connectedLocation?.position
                    );
                    const handleClick = () => {
                      setSelectedConnectionData(connection);
                    };

                    return (
                      <React.Fragment key={`${location?.id}-${connection?.id}`}>
                        <Polyline
                          positions={[
                            location?.position,
                            connectedLocation?.position,
                          ]}
                          pathOptions={{
                            weight: connection.flow * 0.005 + 2,
                            color: getColorFromLoadPercentageAndYear(
                              connection.load_percentage,
                              connection.year
                            ),
                            opacity: isSelectedYear ? 1 : 0.8,
                          }}
                          eventHandlers={{
                            click: handleClick,
                          }}
                        >
                          <Popup>Выведено справа</Popup>
                        </Polyline>

                        <Polyline
                          positions={points}
                          pathOptions={{
                            weight: connection.flow * 0.005 + 2,
                            color: getColorFromLoadPercentageAndYear(
                              connection.load_percentage,
                              connection.year
                            ),
                            opacity: isSelectedYear ? 1 : 0.8,
                          }}
                          eventHandlers={{
                            click: handleClick,
                          }}
                        />
                      </React.Fragment>
                    );
                  }
                  return null;
                })
              )}
            {updateLocations &&
              updateLocations.map((location) =>
                location.connections.map((connection) => {
                  const isSelectedYear = selectedYear === connection.year;
                  const isHidden = hiddenYears2.has(connection.year);
                  if ((isSelectedYear || !selectedYear) && !isHidden) {
                    const connectedLocation = locations?.find(
                      (loc) => loc.id === connection.id
                    );
                    const points = arrowHead(
                      location?.position,
                      connectedLocation?.position
                    );
                    const handleClick = () => {
                      setSelectedConnectionData(connection);
                    };

                    return (
                      <React.Fragment key={`${location?.id}-${connection?.id}`}>
                        <Polyline
                          positions={[
                            location?.position,
                            connectedLocation?.position,
                          ]}
                          pathOptions={{
                            weight: connection.flow * 0.005 + 2,
                            color: getColorFromLoadPercentageAndYear(
                              connection.load_percentage,
                              connection.year
                            ),
                            opacity: isSelectedYear ? 1 : 0.8,
                          }}
                          eventHandlers={{
                            click: handleClick,
                          }}
                        >
                          <Popup>Выведено справа</Popup>
                        </Polyline>

                        <Polyline
                          positions={points}
                          pathOptions={{
                            weight: connection.flow * 0.005 + 1,
                            color: getColorFromLoadPercentageAndYear(
                              connection.load_percentage,
                              connection.year
                            ),
                            opacity: isSelectedYear ? 1 : 0.8,
                          }}
                          eventHandlers={{
                            click: handleClick,
                          }}
                        />
                      </React.Fragment>
                    );
                  }
                  return null;
                })
              )}

            {buildings &&
              buildings.map((building, index) => (
                <Polygon
                  key={index}
                  positions={building}
                  pathOptions={{
                    color: "violet",
                    fillColor: "violet",
                    fillOpacity: 0.5,
                  }}
                >
                  <Popup>Здание</Popup>
                </Polygon>
              ))}
          </MapContainer>
        </div>
      </div>
      <div style={{ width: "25%", marginRight: "0" }}>
        <div className={styles.container}>
          <div className={styles.form}>
            <h3 className={styles.title}>Уточнить граф</h3>
            <form onSubmit={paramSubmit}>
              <div className={styles.inputContainer}>
                <label>Год:</label>
                <input
                  type="number"
                  className={styles.matinput}
                  value={addYear}
                  onChange={(e) => setAddYear(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputContainer}>
                <label>Дети:</label>
                <input
                  className={styles.matinput}
                  type="number"
                  value={children}
                  onChange={(e) => setChildren(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputContainer}>
                <label>Взрослые на машине:</label>
                <input
                  className={styles.matinput}
                  type="number"
                  value={adultsWithCar}
                  onChange={(e) => setAdultsWithCar(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputContainer}>
                <label>Взрослые на ОТ:</label>
                <input
                  className={styles.matinput}
                  type="number"
                  value={adultsWithoutCar}
                  onChange={(e) => setAdultsWithoutCar(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputContainer}>
                <label>На каршеринге:</label>
                <input
                  className={styles.matinput}
                  type="number"
                  value={adultsWithoutCarsharing}
                  onChange={(e) => setAdultsWithoutCarsharing(e.target.value)}
                  required
                />
              </div>
              <div className={styles.inputContainer}>
                <label>Пенсионеры:</label>
                <input
                  className={styles.matinput}
                  type="number"
                  value={pensioners}
                  onChange={(e) => setPensioners(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                {loading3 ? (<div style={{marginLeft:'40%'}}><ClockLoader color="violet"/></div>):(<button type="submit" className={styles.button}>
                  Отправить
                </button>)}
              </div>
            </form>
          </div>
          <div style={{ width:'100%', backgroundColor:'#555555', marginTop:'15px', borderRadius:'10px',  padding: "10px", border: "1px solid #ccc" }}>
            {selectedConnectionData ? (
              <div>
                <h3>Информация о дороге:</h3>
                <p>
                  Пропускная способность: {selectedConnectionData?.max_flow}
                </p>
                <p>Интенсивность движения: {selectedConnectionData.flow}</p>
                <p>Загруженность: {selectedConnectionData.load_percentage}%</p>
              </div>
            ) : (<div>Кликните на ребро графа для получения информации</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
