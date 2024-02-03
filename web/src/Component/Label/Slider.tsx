import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ImageData, InitInfo } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";

type Props = {
    info: InitInfo;
    steps: number;
    images: ImageData[];
    insertLabelFunc: (num: number) => void;
};

function Slider(props: Props) {
    const sampleImage: ImageData = {
        id: "sample",
        url: "",
        generation: 0,
        label: -1,
    };

    return (
        <div>
            <div className="relative">
                <div className="absolute left-1 right-1 bottom-0 m-3 bg-green-500 h-2"></div>
                {(() => {
                    const items = [];
                    for (let i = 0; i <= props.steps * 2; i++) {
                        const label = Math.round(i / 2);
                        if (i % 2 === 1) {
                            const thumbnail = props.images.filter(
                                (image: ImageData) => {
                                    return image.label === label;
                                }
                            );
                            items.push(
                                <div key={"slider-" + i} onClick={() => {}}>
                                    <ImgThumbnail
                                        info={thumbnail[0] || sampleImage}
                                        size={144}
                                        hoverEnable={false}
                                        isDraggable={false}
                                    />
                                    <div className="mt-3 text-center text-white">
                                        <span className="px-3 py-1 rounded-full bg-green-700 text-2xl">
                                            {label}
                                        </span>
                                    </div>
                                </div>
                            );
                        } else {
                            items.push(
                                <button
                                    key={"slider-" + i}
                                    className="px-1 my-1 rounded-full bg-green-700 text-white"
                                    onClick={() => props.insertLabelFunc(i)}
                                >
                                    <FontAwesomeIcon icon={faPlus} size="sm" />
                                </button>
                            );
                        }
                    }
                    return (
                        <div className="flex no-wrap justify-between items-end relative ">
                            {items}
                        </div>
                    );
                })()}
            </div>
            <div className="flex justify-between text-lg my-2">
                <span>←{props.info.start}</span>
                <span>{props.info.end}→</span>
            </div>
        </div>
    );
}

export default Slider;
