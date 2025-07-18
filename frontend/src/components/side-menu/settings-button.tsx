import { Icon } from "../icon";

export const SettingsButton = ({
  setIsSettingsOpen,
}: {
  setIsSettingsOpen: (isOpen: boolean) => void;
}) => {
  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        gap: "10px",
        alignItems: "center",
      }}
    >
      <button
        onClick={() => setIsSettingsOpen(true)}
        style={{
          padding: "8px 12px",
          color: "#dfdfdf",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "20px",
        }}
      >
        <Icon icon={"settings"} />
      </button>
    </div>
  );
};
