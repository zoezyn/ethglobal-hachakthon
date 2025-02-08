import { FC } from "react";

export const Navbar: FC = () => {
  return (
    <div className="flex h-[50px] sm:h-[60px] border-b border-gray-700 py-2 px-2 sm:px-8 items-center justify-between">
      <div className="font-bold text-3xl flex items-center">
        <a
          className="ml-2 text-white hover:opacity-50"
          href="https://code-scaffold.vercel.app"
        >
          Meme AI
        </a>
      </div>
    </div>
  );
};
