"use client";

import { useRouter } from "next/navigation";

type Props = {
  title: string;
  description: string;
  button: string;
  template: string;
};

export default function GoalCard({
  title,
  description,
  button,
  template
}: Props) {

  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/new?template=${template}`);
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm">

      <h3 className="text-xl font-semibold mb-3">
        {title}
      </h3>

      <p className="text-gray-500 mb-6">
        {description}
      </p>

      <button
        onClick={handleClick}
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700"
      >
        {button}
      </button>

    </div>
  );
}