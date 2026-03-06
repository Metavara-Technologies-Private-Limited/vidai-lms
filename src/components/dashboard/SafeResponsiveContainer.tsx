import { useEffect, useRef, useState, type ReactElement } from "react";
import Box from "@mui/material/Box";
import { ResponsiveContainer } from "recharts";

type SafeResponsiveContainerProps = {
  children: ReactElement;
  minHeight?: number;
};

const SafeResponsiveContainer = ({
  children,
  minHeight = 260,
}: SafeResponsiveContainerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canRenderChart, setCanRenderChart] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const update = () => {
      const { width, height } = element.getBoundingClientRect();
      setCanRenderChart(width > 0 && height > 0);
    };

    update();

    const observer = new ResizeObserver(() => update());
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Box ref={containerRef} sx={{ width: "100%", height: "100%", minWidth: 0, minHeight }}>
      {canRenderChart ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : null}
    </Box>
  );
};

export default SafeResponsiveContainer;
