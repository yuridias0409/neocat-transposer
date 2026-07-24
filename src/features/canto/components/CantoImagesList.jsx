import React from "react";

const CantoImagesList = ({ imagensOriginais }) => {
  if (!imagensOriginais || imagensOriginais.length === 0) return null;
  return (
    <div
      className="cifra-imagens-sheet text-center"
      style={{
        width: "100%",
      }}
    >
      {imagensOriginais.map((imgUrl, i) => (
        <img
          key={i}
          src={imgUrl}
          alt={`Ficha ${i + 1}`}
          referrerPolicy="no-referrer"
          style={{
            maxWidth: "100%",
            height: "auto",
            marginBottom: "1rem",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            borderRadius: "8px",
          }}
        />
      ))}
    </div>
  );
};

export default React.memo(CantoImagesList);
