import styles from "./Feature.module.css";

export default function Feature() {
  const statsData = [
    { value: "1000+", label: "Agricultural Products" },
    { value: "50000+", label: "Farmer Touch Points" },
    { value: "20+", label: "Years of Service" },
    { value: "500+", label: "Retail Stores" }
  ];

  return (
    <div className={styles.stats}>
      {statsData.map((item, index) => (
        <div className={styles.stat} key={index}>
          <h2>{item.value}</h2>
          <p>{item.label}</p>
        </div>
      ))}
    </div>
  );
}