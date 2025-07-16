export const SettingsBackdrop = ({
  isSettingsOpen,
  setIsSettingsOpen,
}: {
  isSettingsOpen: boolean;
  setIsSettingsOpen: (isOpen: boolean) => void;
}) => {
  return (
    <div>
      {isSettingsOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 999,
          }}
          onClick={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export const LoadingBackdrop = ({ isLoading }: { isLoading: boolean }) => {
  return (
    <div>
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1>Loading...</h1>
        </div>
      )}
    </div>
  );
};
