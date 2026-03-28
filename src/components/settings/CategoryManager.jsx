import { useState } from "react";
import { useCategories } from "../../hooks/useCategories";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/Dashboard.css";

const COLOR_PALETTE = [
  "#00F0FF",
  "#FED639",
  "#22C55E",
  "#FF8F84",
  "#8B5CF6",
  "#1ABC9C",
  "#E67E22",
  "#3B82F6"
];

const CategoryManager = () => {
  const { categories, addCategory, removeCategory } = useCategories();
  const { t } = useLanguage();

  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense",
    color: COLOR_PALETTE[0]
  });

  const handleAdd = async () => {
    const name = newCategory.name.trim();

    if (!name) {
      alert(t("settings.categoryNameRequired"));
      return;
    }

    const exists = categories.some(
      (category) => category.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
      alert(t("settings.categoryExists"));
      return;
    }

    await addCategory(name, newCategory.type, newCategory.color);

    setNewCategory({
      name: "",
      type: "expense",
      color: COLOR_PALETTE[0]
    });
  };

  return (
    <section className="settings-card">
      <div className="settings-card-header">
        <div>
          <h3 className="settings-card-title">{t("settings.categoryManagement")}</h3>
          <p className="settings-card-copy">{t("settings.categoryManagementDesc")}</p>
        </div>
      </div>

      <div className="category-manager-list">
        {categories.map((category) => (
          <div key={category.id} className="category-item">
            <div className="category-item-left">
              <span
                className="category-color-dot"
                style={{ backgroundColor: category.color || "#95a5a6" }}
              />

              <div className="category-item-meta">
                <span className="category-item-name">{category.name}</span>
                <span className="category-item-caption">
                  {category.type === "income"
                    ? t("settings.income")
                    : t("settings.expense")}
                </span>
              </div>
            </div>

            <div className="category-item-actions">
              <button
                type="button"
                className="adia-button category-manager-button"
                onClick={() => removeCategory(category.id, category.name)}
              >
                {t("settings.deactivate")}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="category-input-row" style={{ marginTop: "18px", gridTemplateColumns: "1.5fr 1fr" }}>
        <input
          className="settings-input"
          placeholder={t("settings.newCategoryName")}
          value={newCategory.name}
          onChange={(event) =>
            setNewCategory((previous) => ({
              ...previous,
              name: event.target.value
            }))
          }
        />

        <select
          className="settings-select"
          value={newCategory.type}
          onChange={(event) =>
            setNewCategory((previous) => ({
              ...previous,
              type: event.target.value
            }))
          }
        >
          <option value="expense">{t("settings.expense")}</option>
          <option value="income">{t("settings.income")}</option>
        </select>
      </div>

      <div className="category-color-picker" style={{ marginTop: "14px" }}>
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            className={
              newCategory.color === color
                ? "category-color-button active"
                : "category-color-button"
            }
            style={{ backgroundColor: color }}
            onClick={() =>
              setNewCategory((previous) => ({
                ...previous,
                color
              }))
            }
          />
        ))}
      </div>

      <div style={{ marginTop: "18px" }}>
        <button type="button" className="adia-button settings-save-button" onClick={handleAdd}>
          {t("settings.addCategory")}
        </button>
      </div>
    </section>
  );
};

export { CategoryManager };
