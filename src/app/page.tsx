"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeCanvas } from "qrcode.react";
import { Link2, Copy, Check, ArrowRight, Download } from "lucide-react";
import toast from "react-hot-toast";
import { linkSchema } from "@/lib/validations/link.schema";
import { z } from "zod";

type FormData = z.infer<typeof linkSchema>;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      originalUrl: "",
      customAlias: "",
    },
  });

  const url = useWatch({ control, name: "originalUrl" });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setShortUrl("");

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.[0]?.message || "Failed to shorten URL");
      }

      const resData = await res.json();
      const fullShortUrl = `${window.location.origin}/${resData.shortCode}`;
      setShortUrl(fullShortUrl);
      toast.success("URL shortened successfully!");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes("alias")) {
          setError("customAlias", { message: error.message });
        } else {
          setError("originalUrl", { message: error.message });
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success("QR Code downloaded!");
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mb-4">
            <Link2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 text-center">
            Shorten Your Link
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 text-center">
            Paste your long URL below to create a concise, shareable link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="url" className="sr-only">
              URL to shorten
            </label>
            <div className="relative">
              <input
                type="text"
                id="url"
                {...register("originalUrl")}
                placeholder="https://example.com/very/long/url"
                className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border ${
                  errors.originalUrl
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 focus:border-indigo-500"
                } rounded-xl focus:ring-2 transition-colors outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400`}
                disabled={isLoading}
              />
            </div>
            {errors.originalUrl && (
              <p className="mt-2 text-sm text-red-500">{errors.originalUrl.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="customAlias" className="sr-only">
              Custom Alias (optional)
            </label>
            <div className="relative">
              <input
                type="text"
                id="customAlias"
                {...register("customAlias")}
                placeholder="Custom alias (optional)"
                className={`w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border ${
                  errors.customAlias
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 focus:border-indigo-500"
                } rounded-xl focus:ring-2 transition-colors outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400`}
                disabled={isLoading}
              />
            </div>
            {errors.customAlias && (
              <p className="mt-2 text-sm text-red-500">{errors.customAlias.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Shorten URL</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {shortUrl && (
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-zinc-100 dark:border-none">
                  <QRCodeCanvas id="qr-code" value={shortUrl} size={150} level="M" />
                </div>
                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="mt-3 flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                  aria-label="Download QR Code"
                >
                  <Download className="w-4 h-4" />
                  <span>Download QR</span>
                </button>
              </div>
              
              <div className="w-full flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <input
                  type="text"
                  readOnly
                  value={shortUrl}
                  className="flex-1 bg-transparent px-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none truncate"
                />
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Copy URL"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
