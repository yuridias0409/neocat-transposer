import React from "react";
export const PsalmistStatus = ({
  userProfile,
  aiData,
  transposition,
  canto,
}) => {
  if (!userProfile) return null;
  if (aiData && transposition === aiData.semitones) {
    return (
      <div
        className="alert alert-success mb-2"
        style={{
          backgroundColor: "#dcfce7",
          color: "#166534",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #bbf7d0",
          fontSize: "0.9rem",
        }}
      >
        <strong>🙎 Salmista Confortável (Tom Ideal)</strong>
        <p
          style={{
            margin: "0.2rem 0 0 0",
          }}
        >
          Este é o melhor tom possível ajustado para a sua extensão vocal!
        </p>
      </div>
    );
  }
  const songMaxFreq = canto.freq_max_curada || canto.freq_max_global;
  const songMinFreq = canto.freq_min_curada || canto.freq_min_global;
  if (
    !songMaxFreq ||
    !songMinFreq ||
    songMaxFreq === -Infinity ||
    songMinFreq === Infinity
  )
    return null;
  let currentMaxFreq = songMaxFreq * Math.pow(2, transposition / 12);
  let currentMinFreq = songMinFreq * Math.pow(2, transposition / 12);
  const userMaxActual = userProfile.max?.freq || userProfile.f0_max || 330;
  const userMinActual = userProfile.min?.freq || userProfile.f0_min || 110;
  const userCenter = (userMaxActual + userMinActual) / 2;
  while (true) {
    let currentCenter = (currentMaxFreq + currentMinFreq) / 2;
    if (
      Math.abs(currentCenter * 2 - userCenter) <
      Math.abs(currentCenter - userCenter)
    ) {
      currentMaxFreq *= 2;
      currentMinFreq *= 2;
    } else {
      break;
    }
  }
  while (true) {
    let currentCenter = (currentMaxFreq + currentMinFreq) / 2;
    if (
      Math.abs(currentCenter / 2 - userCenter) <
      Math.abs(currentCenter - userCenter)
    ) {
      currentMaxFreq /= 2;
      currentMinFreq /= 2;
    } else {
      break;
    }
  }
  const diffMaxSemitones = 12 * Math.log2(currentMaxFreq / userMaxActual);
  const diffMinSemitones = 12 * Math.log2(userMinActual / currentMinFreq);
  if (diffMaxSemitones > 2) {
    return (
      <div
        className="alert alert-danger mb-2"
        style={{
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #fecaca",
          fontSize: "0.9rem",
        }}
      >
        <strong>🙎 Salmista Muito Desconfortável (Agudo)</strong>
        <p
          style={{
            margin: "0.2rem 0 0 0",
          }}
        >
          Este tom está muito agudo e pode forçar sua voz.
        </p>
      </div>
    );
  } else if (diffMaxSemitones > 0) {
    return (
      <div
        className="alert alert-warning mb-2"
        style={{
          backgroundColor: "#fef3c7",
          color: "#92400e",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #fde68a",
          fontSize: "0.9rem",
        }}
      >
        <strong>🙎 Salmista com Leve Esforço (Agudo)</strong>
        <p
          style={{
            margin: "0.2rem 0 0 0",
          }}
        >
          Este tom exigirá um pequeno esforço nos agudos.
        </p>
      </div>
    );
  }
  if (diffMinSemitones > 2) {
    return (
      <div
        className="alert alert-danger mb-2"
        style={{
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #fecaca",
          fontSize: "0.9rem",
        }}
      >
        <strong>🙎 Salmista Muito Desconfortável (Grave)</strong>
        <p
          style={{
            margin: "0.2rem 0 0 0",
          }}
        >
          Este tom está muito grave e faltará projeção.
        </p>
      </div>
    );
  } else if (diffMinSemitones > 0) {
    return (
      <div
        className="alert alert-warning mb-2"
        style={{
          backgroundColor: "#fef3c7",
          color: "#92400e",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #fde68a",
          fontSize: "0.9rem",
        }}
      >
        <strong>🙎 Salmista com Leve Esforço (Grave)</strong>
        <p
          style={{
            margin: "0.2rem 0 0 0",
          }}
        >
          Este tom exigirá um leve esforço para alcançar os graves.
        </p>
      </div>
    );
  }
  return (
    <div
      className="alert alert-success mb-2"
      style={{
        backgroundColor: "#dcfce7",
        color: "#166534",
        padding: "0.75rem",
        borderRadius: "8px",
        border: "1px solid #bbf7d0",
        fontSize: "0.9rem",
      }}
    >
      <strong>🙎 Salmista Confortável</strong>
      <p
        style={{
          margin: "0.2rem 0 0 0",
        }}
      >
        O tom está dentro do seu alcance vocal ideal!
      </p>
    </div>
  );
};
