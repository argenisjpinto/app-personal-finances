import "../../styles/Dashboard.css";

const Toast = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.message}
    </div>
  );
};

export { Toast };