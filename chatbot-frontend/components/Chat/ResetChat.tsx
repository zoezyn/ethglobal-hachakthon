import { FC } from "react";

interface Props {
  onReset: () => void;
}

export const ResetChat: FC<Props> = ({ onReset }) => {
  return (
    <button
      className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors duration-200"
      onClick={onReset}
    >
      Reset
    </button>
  );
};