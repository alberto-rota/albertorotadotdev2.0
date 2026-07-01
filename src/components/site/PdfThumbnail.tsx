"use client";

import * as React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PageSize = { width: number; height: number };

function computeRenderWidth(
  container: PageSize,
  page: PageSize,
  fit: "cover" | "contain"
): number {
  const pageAspect = page.width / page.height;
  const containerAspect = container.width / container.height;

  if (fit === "contain") {
    return containerAspect > pageAspect
      ? container.height * pageAspect
      : container.width;
  }

  // cover — scale so the page fills the container, cropping the overflow axis.
  return containerAspect > pageAspect
    ? container.width
    : container.height * pageAspect;
}

/**
 * Renders the first page of a local PDF, sized to its container.
 * Calls `onFail` (and renders nothing) if the PDF can't be loaded/rendered,
 * so callers can fall back to a static thumbnail image.
 */
export function PdfThumbnail({
  src,
  fit = "cover",
  anchor = "top",
  /** Slight upscale in cover mode to trim typical PDF page margins. */
  zoom = 1.05,
  className,
  onFail,
}: {
  src: string;
  fit?: "cover" | "contain";
  /** Vertical anchor when the rendered page is taller than the container. */
  anchor?: "top" | "center";
  zoom?: number;
  className?: string;
  onFail?: () => void;
}) {
  const [failed, setFailed] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState<PageSize>({ width: 0, height: 0 });
  const [pageSize, setPageSize] = React.useState<PageSize | null>(null);

  const fail = React.useCallback(() => {
    setFailed(true);
    onFail?.();
  }, [onFail]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      setContainerSize({ width, height });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDocumentLoadSuccess = React.useCallback(
    async (pdf: { getPage: (n: number) => Promise<{ getViewport: (opts: { scale: number }) => { width: number; height: number } }> }) => {
      try {
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setPageSize({ width: viewport.width, height: viewport.height });
      } catch {
        fail();
      }
    },
    [fail]
  );

  const layout = React.useMemo(() => {
    if (!pageSize || containerSize.width <= 0 || containerSize.height <= 0) {
      return null;
    }

    const renderWidth =
      computeRenderWidth(containerSize, pageSize, fit) * (fit === "cover" ? zoom : 1);
    const renderHeight = renderWidth * (pageSize.height / pageSize.width);

    return {
      renderWidth,
      left: (containerSize.width - renderWidth) / 2,
      top:
        fit === "cover" && anchor === "top"
          ? 0
          : (containerSize.height - renderHeight) / 2,
    };
  }, [anchor, containerSize, fit, pageSize, zoom]);

  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden bg-white", className)}
    >
      {containerSize.width > 0 ? (
        <Document
          file={src}
          loading={null}
          error={null}
          onLoadError={fail}
          onLoadSuccess={onDocumentLoadSuccess}
          className="h-full w-full"
        >
          {layout ? (
            <div
              className="absolute"
              style={{
                top: layout.top,
                left: layout.left,
                width: layout.renderWidth,
              }}
            >
              <Page
                pageNumber={1}
                width={layout.renderWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={null}
                error={null}
                onRenderError={fail}
                className="[&_canvas]:block!"
              />
            </div>
          ) : null}
        </Document>
      ) : null}
    </div>
  );
}
