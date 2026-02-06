import React, { useState } from "react";
import { Zap } from "lucide-react";
import {
  INTEGRATION_STYLES,
  PLATFORMS,
  getStatusMessage,
} from "../../../styles/Settings/Integration.styles";
import type { IntegrationState } from "../../../types/integration.types";

const Integration: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationState>({
    facebook: { connected: true },
  });

  const handleToggle = (key: string, isConnected: boolean): void => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...prev[key], connected: !isConnected },
    }));
  };

  return (
    <div className="p-1">
      <h1 className="text-2xl font-bold text-slate-900">Integration</h1>
      <p className="text-sm text-slate-500 mb-8">
        Connect your favorite tools and platforms
      </p>

      <div className={INTEGRATION_STYLES.content.grid}>
        {PLATFORMS.map((platform) => {
          const isConnected = integrations[platform.key]?.connected ?? false;

          return (
            <div
              key={platform.key}
              className={`${INTEGRATION_STYLES.card.base}`}
            >
              {/* Header */}
              <div className={INTEGRATION_STYLES.cardHeader.wrapper}>
                <div className={INTEGRATION_STYLES.cardHeader.iconWrapper}>
                  {platform.icon}
                </div>
                <div>
                  <h3 className={INTEGRATION_STYLES.cardHeader.platformName}>
                    {platform.name}
                  </h3>
                  <p className={INTEGRATION_STYLES.cardHeader.description}>
                    {platform.description}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className={INTEGRATION_STYLES.divider} />

              {/* Body */}
              <div className={INTEGRATION_STYLES.cardBody.wrapper}>
                <div className={INTEGRATION_STYLES.cardBody.statusIconWrapper}>
                  <Zap
                    className={
                      isConnected
                        ? INTEGRATION_STYLES.cardBody.statusIcon.connected
                        : INTEGRATION_STYLES.cardBody.statusIcon.disconnected
                    }
                    fill={isConnected ? "currentColor" : "none"}
                  />
                </div>

                <h4 className={INTEGRATION_STYLES.cardBody.statusText}>
                  {isConnected ? "Connected" : "Not Connected"}
                </h4>

                <p className={INTEGRATION_STYLES.cardBody.message}>
                  {getStatusMessage(isConnected, platform.name)}
                </p>

                <button
                  onClick={() => handleToggle(platform.key, isConnected)}
                  className={INTEGRATION_STYLES.button}
                >
                  {platform.icon}
                  {isConnected ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className={INTEGRATION_STYLES.infoSection.wrapper}>
        <h3 className={INTEGRATION_STYLES.infoSection.title}>Why Connect?</h3>
        <p className={INTEGRATION_STYLES.infoSection.description}>
          Integrating your favorite platforms streamlines your workflow,
          automates campaign management, and keeps all your data synchronized in
          one place.
        </p>
      </div>
    </div>
  );
};

export default Integration;
