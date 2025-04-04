import { Helmet } from "react-helmet-async";

interface MetaDataProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const MetaData = ({
  title = "Trivmaster",
  description = "Interactive trivia platform",
  image = "/logo.png",
  url
}: MetaDataProps) => {
  const fullTitle = title === "Trivmaster" ? title : `${title} | Trivmaster`;
  const currentUrl = url || window.location.href;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={currentUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      {image && <meta property="twitter:image" content={image} />}
    </Helmet>
  );
};

export default MetaData;
