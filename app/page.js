"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Popup } from "react-leaflet";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import "leaflet/dist/leaflet.css";

const locations = [
  {
    id: 1,
    name: "Точка 1",
    position: [55.7558, 37.6173],
    connections: [
      { id: 2, year: 2023, width: 2 },
      { id: 3, year: 2024, width: 2 },
    ],
  },
  {
    id: 2,
    name: "Точка 2",
    position: [55.7602, 37.6173],
    connections: [
      { id: 1, year: 2023, width: 2 },
      { id: 4, year: 2025, width: 2 },
    ],
  },
  {
    id: 3,
    name: "Точка 3",
    position: [55.7539, 37.6208],
    connections: [
      { id: 1, year: 2024, width: 3 },
      { id: 5, year: 2023, width: 2 },
    ],
  },
  {
    id: 4,
    name: "Точка 4",
    position: [55.759, 37.6155],
    connections: [{ id: 2, year: 2025, width: 3 }],
  },
  {
    id: 5,
    name: "Точка 5",
    position: [55.754, 37.618],
    connections: [
      { id: 3, year: 2023, width: 2 },
      { id: 6, year: 2024, width: 3 },
    ],
  },
  {
    id: 6,
    name: "Точка 6",
    position: [55.755, 37.619],
    connections: [
      { id: 5, year: 2024, width: 2 },
      { id: 7, year: 2025, width: 2 },
    ],
  },
  {
    id: 7,
    name: "Точка 7",
    position: [55.758, 37.62],
    connections: [
      { id: 6, year: 2025, width: 3 },
      { id: 8, year: 2023, width: 2 },
    ],
  },
  {
    id: 8,
    name: "Точка 8",
    position: [55.762, 37.621],
    connections: [
      { id: 7, year: 2023, width: 2 },
      { id: 9, year: 2024, width: 2 },
    ],
  },
  {
    id: 9,
    name: "Точка 9",
    position: [55.763, 37.622],
    connections: [
      { id: 8, year: 2024, width: 3 },
      { id: 10, year: 2025, width: 2 },
    ],
  },
  {
    id: 10,
    name: "Точка 10",
    position: [55.764, 37.623],
    connections: [{ id: 9, year: 2025, width: 3 }],
  },
  {
    id: 11,
    name: "Точка 11",
    position: [55.765, 37.624],
    connections: [{ id: 12, year: 2023, width: 2 }],
  },
  {
    id: 12,
    name: "Точка 12",
    position: [55.766, 37.625],
    connections: [
      { id: 11, year: 2023, width: 2 },
      { id: 13, year: 2024, width: 2 },
    ],
  },
  {
    id: 13,
    name: "Точка 13",
    position: [55.767, 37.626],
    connections: [
      { id: 12, year: 2024, width: 2 },
      { id: 14, year: 2025, width: 2 },
    ],
  },
  {
    id: 14,
    name: "Точка 14",
    position: [55.768, 37.627],
    connections: [{ id: 13, year: 2025, width: 3 }],
  },
  {
    id: 15,
    name: "Точка 15",
    position: [55.769, 37.628],
    connections: [{ id: 10, year: 2024, width: 2 }],
  },
];

const arrowHead = (latlng1, latlng2) => {
  const angle = Math.atan2(latlng2[1] - latlng1[1], latlng2[0] - latlng1[0]);
  const headLength = 0.0002;
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

const MapComponent = () => {
  const [selectedYear, setSelectedYear] = useState();
  const [token, setToken] = useState(null);
  const [file, setFile] = useState(null);
  const [year, setYear] = useState();

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value ? Number(e.target.value) : null);
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
};

const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Время года:", year);
    console.log("Токен:", token);
    console.log("Файл:", file ? file.name : "Не выбран");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("token", token);
    formData.append("year", year);

    try {
        const response = await fetch("url", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Ошибка: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Ответ от сервера:", data);
    } catch (error) {
        console.error("Ошибка при отправке данных:", error);
    }
};

  const getOpacity = (year) => {
    switch (year) {
      case 2023:
        return "red";
      case 2024:
        return "green";
      case 2025:
        return "violet";
      default:
        return "blue";
    }
  };

  useEffect(() => {
    const existingToken = Cookies.get("userToken");
    if (!existingToken) {
      const newToken = uuidv4();
      Cookies.set("userToken", newToken, { expires: 365 });
      setToken(newToken);
    } else {
      setToken(existingToken);
    }
  }, []);


  return (
    <div style={{ width: "100%", display: "flex" }}>
      <div style={{ width: "25%" }}>
        <h2>Загрузка ZIP-файла</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Время года:
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </label>

          <label>
            Выберите ZIP-файл:
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              required
            />
          </label>
          <button type="submit">Отправить</button>
        </form>
      </div>
      <div style={{ width: "50%" }}>
        <div>
          <div style={{ margin: "10px" }}>
            <label>Выберите год: </label>
            <select value={selectedYear || ""} onChange={handleYearChange}>
              <option value="">Все</option>
              <option value={2023}>2023</option>
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
            </select>
          </div>
          <MapContainer
            center={[55.7558, 37.6173]}
            zoom={15}
            style={{ height: "100vh" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {locations.map((location) =>
              location.connections.map((connection) => {
                const isSelectedYear = selectedYear === connection.year;
                if (!selectedYear || isSelectedYear) {
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
                            : getOpacity(connection.year),
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
                            : getOpacity(connection.year),
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

export default MapComponent;