import { Tooltip } from "react-tooltip";
import { History, ImageData } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";

type Props = {
    histories: History[];
    addUnLabeledImageFunc: (images: ImageData[]) => void;
};

function GenHistory(props: Props) {
    return (
        <div className="h-full flex flex-col">
            <div className="text-lg font-bold">Generated Result / History</div>
            <div className="grow border-4 border-white w-100 h-full min-h-0 p-2 divide-y-2 divide-white overflow-y-scroll">
                {props.histories.map((history: History) => {
                    return (
                        <div className="flex py-1" key={"genHis-" + history.id}>
                            <div className="flex no-wrap">
                                {history.images.map((image: ImageData) => {
                                    return (
                                        <div
                                            key={"genHis-item-" + image.id}
                                            className="w-36 m-1"
                                            onClick={() => {
                                                props.addUnLabeledImageFunc(
                                                    history.images.filter(
                                                        (item: ImageData) => {
                                                            return (
                                                                item.id ===
                                                                image.id
                                                            );
                                                        }
                                                    )
                                                );
                                            }}
                                        >
                                            <ImgThumbnail
                                                info={image}
                                                size={144}
                                                hoverEnable={true}
                                                buttonText="Click to Add Image"
                                                isDraggable={false}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-2">
                                <div className="mb-2 text-lg font-bold">
                                    Generate Setting
                                </div>
                                <div
                                    className="text-overflow"
                                    data-tooltip-id={"tooltip-" + history.id}
                                    data-tooltip-content={
                                        history.setting.prompt
                                    }
                                >
                                    Prompt: {history.setting.prompt} <br />
                                    CFG: {history.setting.cfgLabel}
                                    <Tooltip id={"tooltip-" + history.id} />
                                </div>
                                <button
                                    className="mt-4 p-2 bg-blue-700 text-white rounded"
                                    onClick={() => {
                                        props.addUnLabeledImageFunc(
                                            history.images
                                        );
                                    }}
                                >
                                    Add All Image to Image Pool
                                </button>
                            </div>
                        </div>
                    );
                })}
                {props.histories.length === 0 && (
                    <div className="text-center text-gray-400 text-xl py-4">
                        Generate Result / History will be shown in this Area.
                    </div>
                )}
            </div>
        </div>
    );
}

export default GenHistory;
