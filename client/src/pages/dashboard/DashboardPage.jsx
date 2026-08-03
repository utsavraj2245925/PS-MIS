import React, {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  Spin,
  Card,
} from "antd";

import ExecutiveKPICards
from "./components/ExecutiveKPICards";

const DashboardPage = () => {

  const [loading,setLoading] =
    useState(true);

  const [cards,setCards] =
    useState({});

  const fetchSummary =
    async () => {

      try {

        const token =
          localStorage.getItem("token");

        const res =
          await axios.get(
            "/api/dashboard/summary",
            {
              headers:{
                Authorization:
                `Bearer ${token}`
              }
            }
          );

        setCards(
          res.data.data.cards
        );

      } catch(error){
        console.error(error);
      } finally{
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchSummary();
  }, []);

  if(loading){
    return <Spin fullscreen />;
  }

  return (
    <div className="p-4">

      <div
        style={{
          position:"sticky",
          top:64,
          zIndex:100,
          background:"#fff",
          paddingBottom:12,
        }}
      >
        <ExecutiveKPICards
          cards={cards}
        />
      </div>

    </div>
  );
};

export default DashboardPage;