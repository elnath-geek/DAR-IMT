import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { History, ImageData } from "../../Type/type";
import GenHistory from "./GenHistory";
import GenSample from "./GenSample";
import Generator from "./Generator";

type Props = {
    user: string;
    enable: boolean;
    baseImage: ImageData;
    closeGenerateFunc: (flag: boolean) => void;
    addUnLabeledImageFunc: (images: ImageData[]) => void;
};

function GererateArea(props: Props) {
    const [genHistory, setGenHistory] = useState<History[]>([]);

    function addGenHistory(history: History) {
        setGenHistory([history, ...genHistory]);
    }

    return (
        <div
            className={
                props.enable
                    ? "relative opacity-100 ease-in-out duration-500 block z-10"
                    : "opacity-0 ease-in-out translate-x-full duration-500 scale-x-0"
            }
        >
            <div className="ml-2 my-2 p-4 h-[95vh] shadow bg-blue-100 rounded-l-lg basis-4/5 flex flex-col">
                <div className="flex">
                    <div onClick={() => props.closeGenerateFunc(false)}>
                        <FontAwesomeIcon icon={faXmark} size="2x" />
                    </div>
                    <GenSample />
                </div>
                <Generator
                    user={props.user}
                    image={props.baseImage}
                    addHistoryFunc={addGenHistory}
                />
                <div className="grow overflow-y-scroll without-bar">
                    <GenHistory
                        histories={genHistory}
                        addUnLabeledImageFunc={props.addUnLabeledImageFunc}
                    />
                </div>
            </div>
        </div>
    );
}

export default GererateArea;
