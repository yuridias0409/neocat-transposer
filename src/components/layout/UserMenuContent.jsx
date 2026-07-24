import React from "react";
import { ChevronDown } from "lucide-react";
import { getVoiceClassification } from "../../domain/musicMath";
import { freqToNoteName } from "../../features/calibrador/utils/calibradorUtils";

const UserMenuContent = ({ user, voiceProfile, onClick }) => {
  const voiceType = voiceProfile
    ? getVoiceClassification(voiceProfile.min?.freq, voiceProfile.max?.freq)
    : null;
  const voiceRange = voiceProfile
    ? `${freqToNoteName(voiceProfile.min?.freq)} → ${freqToNoteName(voiceProfile.max?.freq)}`
    : null;

  return (
    <div
      className="user-profile-info"
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        transition: "background-color 0.2s",
        paddingRight: onClick ? "0.5rem" : "0.75rem",
      }}
    >
      <div className="user-details">
        <span className="user-name">{user.split("@")[0]}</span>
        {voiceType && (
          <div className="voice-badge">
            <span className="voice-type-text">{voiceType}:</span>
            <span className="voice-range-text">{voiceRange}</span>
          </div>
        )}
      </div>
      {onClick && (
        <ChevronDown
          size={16}
          color="#8898aa"
          style={{
            marginLeft: "0.25rem",
          }}
        />
      )}
    </div>
  );
};

export default React.memo(UserMenuContent);
