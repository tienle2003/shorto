"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QRCodeCanvas } from "qrcode.react";
import { Link2, Copy, Check, ArrowRight, Download, Link, Tag } from "lucide-react";
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
    <div className="relative flex flex-col flex-1 items-center justify-center bg-slate-100 font-sans dark:bg-zinc-950 p-4 overflow-hidden">
      {/* Decorative Background Orbs */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-indigo-400/60 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-100 animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-400/60 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-100 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }} />
      <div className="absolute top-[20%] left-[40%] w-[500px] h-[500px] bg-pink-400/60 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-100 animate-pulse" style={{ animationDelay: '4s', animationDuration: '6s' }} />

      <main className="relative z-10 w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-indigo-50 dark:border-zinc-800 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30">
            <Link2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 text-center tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-500 dark:from-indigo-400 dark:to-fuchsia-400">Shorto Tool</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 text-center px-4">
            The blazing-fast way to transform your long URLs into concise, shareable links.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="url" className="sr-only">
              URL to shorten
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Link className={`w-5 h-5 transition-colors duration-300 ${errors.originalUrl ? 'text-red-400' : 'text-zinc-400 group-focus-within:text-indigo-500'}`} />
              </div>
              <input
                type="text"
                id="url"
                {...register("originalUrl")}
                placeholder="https://example.com/very/long/url"
                className={`w-full pl-11 pr-4 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/50 border ${
                  errors.originalUrl
                    ? "border-red-500 focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                } rounded-xl transition-all duration-300 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400`}
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
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Tag className={`w-5 h-5 transition-colors duration-300 ${errors.customAlias ? 'text-red-400' : 'text-zinc-400 group-focus-within:text-indigo-500'}`} />
              </div>
              <input
                type="text"
                id="customAlias"
                {...register("customAlias")}
                placeholder="Custom alias (optional)"
                className={`w-full pl-11 pr-4 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/50 border ${
                  errors.customAlias
                    ? "border-red-500 focus:ring-4 focus:ring-red-500/20 focus:border-red-500"
                    : "border-zinc-200 dark:border-zinc-800 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                } rounded-xl transition-all duration-300 outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400`}
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
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300"
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
          <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
            <div className="bg-slate-50 dark:bg-zinc-900/60 p-6 rounded-2xl border border-indigo-100/50 dark:border-zinc-800 flex flex-col items-center shadow-inner">
              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-zinc-100 dark:border-none ring-1 ring-black/5">
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
