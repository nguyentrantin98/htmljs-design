import React, { useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import "./ExchangeRate.css";

const ExchangeRate = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [exchangeRates, setExchangeRates] = useState(null); // Để object thay vì array

  const toggleChatWindow = () => {
    setIsChatOpen((prev) => {
      if (!prev) {
        // Chỉ lấy dữ liệu khi mở popup
        const storedRates = localStorage.getItem("ExchangeRateVND");
        if (storedRates) {
          setExchangeRates(JSON.parse(storedRates));
        }
      }
      return !prev;
    });
  };

  return (
    <>
      <div className="chat-icon2" onClick={toggleChatWindow}>
        <FaMoneyBillWave size={25} color="white" />
      </div>

      {isChatOpen && (
        <div className="settings">
          <div className="settings-content">
            <ul>
              <li className="fix-header">
                <div className="fix-header-wrapper">
                  <a
                    href="https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Vietcombank Exchange
                  </a>
                </div>
              </li>
            </ul>
            <ul className="exchange-rate">
              {exchangeRates ? (
                Object.keys(exchangeRates).map((currencyCode, index) => (
                  <li key={index}>
                    {currencyCode}: {exchangeRates[currencyCode]}
                  </li>
                ))
              ) : (
                <li>Chưa có dữ liệu tỷ giá.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ExchangeRate;