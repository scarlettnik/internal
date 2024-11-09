"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import "leaflet/dist/leaflet.css";
import styles from "./card.module.css";
import { Eye, EyeClosed } from "lucide-react";

const arrowHead = (latlng1, latlng2) => {
  const angle = Math.atan2(latlng2[1] - latlng1[1], latlng2[0] - latlng1[0]);
  const headLength = 0.00005;
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
  const [years, setYears] = useState([]);
  const [locations, setLocations] = useState([]);
  const [position, setPosition] = useState([55.7558, 37.6173]);
  const [fileName, setFileName] = useState("");
  const mapRef = useRef(null);
  const [addYear, setAddYear] = useState('');
  const [children, setChildren] = useState(0);
  const [adultsWithCar, setAdultsWithCar] = useState(0);
  const [adultsWithoutCar, setAdultsWithoutCar] = useState(0);
  const [pensioners, setPensioners] = useState(0);

  const handleYearClick = (year) => {
    setSelectedYear(year === selectedYear ? null : year);
  };

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

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);

    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
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
        "https://marlin-darling-pipefish.ngrok-free.app/api/v1/uploads",
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
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);

      const extractedYears = Array.from(
        new Set(data.graphs.map((item) => item.year))
      );

      setYears(extractedYears);
      setLocations(data.graphs.flatMap((item) => item.nodes));
      console.log(data.position);
      if (mapRef.current) {
        mapRef.current.flyTo(data.position, 18);
      } else {
        console.error("Map reference is not set.");
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
        "https://marlin-darling-pipefish.ngrok-free.app/api/v1/graph",
        {
          method: "POST",
          headers: { "ngrok-skip-browser-warning": "true" },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Ответ от сервера:", data);

      setYears((prevYears) => {
        if (!prevYears.includes(data.year)) {
          return [...prevYears, data.year];
        }
        return prevYears;
      });

      setLocations((prevLocations) => [...prevLocations, ...data.nodes]);
    } catch (error) {
      console.error("Ошибка при отправке данных:", error);
    }
  };
  const showAllYears = () => {
    setSelectedYear(null);
  };

  const getColorAndOpacity = (year) => {
    const baseColor = [0, 0, 255];
    const maxYear = Math.max(...years);

    if (year === maxYear) {
      return {
        color: "violet",
        opacity: 1,
      };
    }

    const brightnessFactor = Math.max(0.2, 1 - (maxYear - year) * 0.3);
    const adjustedColor = baseColor.map((color) =>
      Math.floor(color * brightnessFactor)
    );
    const opacity = Math.max(0.1, 1 - (maxYear - year) * 0.25);

    return {
      color: `rgb(${adjustedColor[0]}, ${adjustedColor[1]}, ${adjustedColor[2]})`,
      opacity: opacity,
    };
  };

  return (
    <div style={{ width: "100%", display: "flex" }}>
      <div style={{ width: "25%" }}>
        <div className={styles.container}>
          <h2 className={styles.title}>Загрузите новые данные</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label>
                Время года:
                <input
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
          <div className={styles.buttonContainer}>
            {years.map((year) => (
              <div key={year} className={styles.buttonWrapper}>
                <div style={{ display: "flex" }}>
                  <button
                    onClick={() => handleYearClick(year)}
                    className={`${styles.yearButton} ${
                      selectedYear === year ? styles.active : ""
                    }`}
                  >
                    {year}
                  </button>
                  <button
                    onClick={() => toggleVisibility(year)}
                    style={{
                      marginLeft: "5px",
                      backgroundColor: hiddenYears.has(year) ? "red" : "green",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                      padding: "5px",
                    }}
                  >
                    {hiddenYears.has(year) ? <EyeClosed /> : <Eye />}
                  </button>
                </div>
              </div>
            ))}
            <div className={styles.buttonWrapper}>
              <button
                onClick={showAllYears}
                className={`${styles.yearButton} ${
                  selectedYear == null ? styles.active : ""
                }`}
              >
                Показать все годы
              </button>
            </div>
          </div>
        </div>
        <div style={{ padding: '20px' }}>
      <h2>Введите данные</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Год:
            <input
              type="number"
              value={addYear}
              onChange={(e) => setAddYear(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Дети:
            <input
              type="number"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Взрослые на машине:
            <input
              type="number"
              value={adultsWithCar}
              onChange={(e) => setAdultsWithCar(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Взрослые без машины:
            <input
              type="number"
              value={adultsWithoutCar}
              onChange={(e) => setAdultsWithoutCar(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Пенсионеры:
            <input
              type="number"
              value={pensioners}
              onChange={(e) => setPensioners(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Отправить</button>
      </form>
    </div>
      </div>
      <div style={{ width: "50%" }}>
        <div>
          <MapContainer
            center={[55.7558, 37.6173]}
            zoom={15}
            style={{ height: "100vh" }}
            ref={mapRef}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {locations.map((location) =>
              location.connections.map((connection) => {
                const isSelectedYear = selectedYear === connection.year;
                const isHidden = hiddenYears.has(connection.year);
                if ((!selectedYear || isSelectedYear) && !isHidden) {
                  const connectedLocation = locations.find(
                    (loc) => loc.id === connection.id
                  );
                  const points = arrowHead(
                    location.position,
                    connectedLocation.position
                  );

                  return (
                    <React.Fragment key={`${location.id}-${connection.id}`}>
                      <Polyline
                        positions={[
                          location.position,
                          connectedLocation.position,
                        ]}
                        pathOptions={{
                          weight: connection.width,
                          color: isSelectedYear
                            ? "blue"
                            : getColorAndOpacity(connection.year).color,
                          opacity: isSelectedYear
                            ? 1
                            : getColorAndOpacity(connection.year).opacity,
                        }}
                      >
                        <Popup>
                          {`От: ${location.name} \nКуда: ${connectedLocation.name}`}
                        </Popup>
                      </Polyline>

                      <Polyline
                        positions={points}
                        pathOptions={{
                          weight: connection.width,
                          color: isSelectedYear
                            ? "blue"
                            : getColorAndOpacity(connection.year).color,
                          opacity: isSelectedYear
                            ? 1
                            : getColorAndOpacity(connection.year).opacity,
                        }}
                      />
                    </React.Fragment>
                  );
                }
                return null;
              })
            )}
          </MapContainer>
        </div>
      </div>
      <div style={{ width: "20%", marginRight: "0" }}>Часть 3</div>
    </div>
  );
};

export default Card;
