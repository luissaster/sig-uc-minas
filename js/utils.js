
export const Utils = {
  showNotification: (title, message, type = "info", duration = 5000) => {
    const notifications = document.getElementById("notifications");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    const icons = { info: "ℹ️", success: "✅", error: "❌", warning: "⚠️" };
    
    const iconSpan = document.createElement("span");
    iconSpan.className = "notification-icon";
    iconSpan.textContent = icons[type] || icons.info;

    const contentDiv = document.createElement("div");
    contentDiv.className = "notification-content";

    const titleDiv = document.createElement("div");
    titleDiv.className = "notification-title";
    titleDiv.textContent = title;

    const messageDiv = document.createElement("div");
    messageDiv.className = "notification-message";
    messageDiv.textContent = message;

    const closeButton = document.createElement("button");
    closeButton.className = "notification-close";
    closeButton.textContent = "×";

    contentDiv.appendChild(titleDiv);
    contentDiv.appendChild(messageDiv);
    notification.appendChild(iconSpan);
    notification.appendChild(contentDiv);
    notification.appendChild(closeButton);

    notifications.appendChild(notification);
    setTimeout(() => {
      if (notification.parentNode) notification.remove();
    }, duration);
    closeButton.addEventListener("click", () => notification.remove());
  },
  showLoading: () => {
    const loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) loadingSpinner.classList.add("show");
  },
  hideLoading: () => {
    const loadingSpinner = document.getElementById("loadingSpinner");
    if (loadingSpinner) loadingSpinner.classList.remove("show");
  },
  isValidCoordinates: (query) => {
    const coordPattern = /^(-?\d+\.?\d*)[\,\s]+(-?\d+\.?\d*)$/;
    const match = query.match(coordPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    return false;
  },
  extractCoordinates: (query) => {
    const coordPattern = /(-?\d+\.?\d*)[\,\s]+(-?\d+\.?\d*)/;
    const match = query.match(coordPattern);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  },
};
