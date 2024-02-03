import { ImageData, InitInfo } from "../../Type/type";
import ImageView from "./ImageView";
import Slider from "./Slider";

type Props = {
    info: InitInfo;
    images: ImageData[];
    steps: number;
    isTest: boolean;
    setImagesFunc: (images: ImageData[]) => void;
    setStepsFunc: (num: number) => void;
};

function LabelArea(props: Props) {
    const minStepNum = 5;
    const maxStepNum = 10;

    function insertLabel(stepNum: number) {
        let tmp = props.steps + 1;
        if (tmp > maxStepNum) {
            alert("Can't increase step number more");
            return;
        }
        props.setStepsFunc(tmp);
        const newImages = props.images.map((image: ImageData) => {
            if (image.label > stepNum / 2) {
                image.label += 1;
            }
            return image;
        });
        props.setImagesFunc([...newImages]);
    }

    function deleteLabel(labelIdx: number) {
        let tmp = props.steps - 1;
        if (tmp < minStepNum) {
            alert("Can't decrease step number more");
            return;
        }
        props.setStepsFunc(tmp);
        const newImages = props.images.map((image: ImageData) => {
            if (image.label === labelIdx) {
                image.label = 0;
            } else if (image.label > labelIdx) {
                image.label -= 1;
            }
            return image;
        });
        props.setImagesFunc([...newImages]);
    }

    return (
        <div className="px-4 py-2 h-full flex flex-col">
            <div className="text-lg font-bold">Label</div>
            <Slider
                info={props.info}
                steps={props.steps}
                images={props.images}
                insertLabelFunc={insertLabel}
            />
            <div className="grow flex no-wrap mt-4 w-100 divide-x-4 border-4 overflow-y-scroll overflow-x-scroll">
                {Array(props.steps)
                    .fill(0)
                    .map((_, i) => {
                        return (
                            <div key={"imageview-" + i} className="min-w-[30%]">
                                <ImageView
                                    steps={props.steps}
                                    images={props.images}
                                    selectedArea={i + 1}
                                    isTest={props.isTest}
                                    deleteLabelFunc={deleteLabel}
                                />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

export default LabelArea;
