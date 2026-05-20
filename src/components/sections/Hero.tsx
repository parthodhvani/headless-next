type HeroProps = {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  backgroundImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
};

export default function Hero({
  heading,
  subheading,
  ctaText,
  ctaUrl,
  backgroundImage,
}: HeroProps) {
  return (
    <section
      style={{
        padding: "100px 20px",
        color: "white",
        textAlign: "center",
        backgroundImage: `url(${backgroundImage?.node?.sourceUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <h1>{heading}</h1>

      <p>{subheading}</p>

      <a href={ctaUrl}>
        <button>{ctaText}</button>
      </a>
    </section>
  );
}