import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ImageData, InitInfo, TrainState } from "../../Type/type";

type Props = {
    images: ImageData[];
    info: InitInfo;
    state: TrainState;
    labelState: number[];
    setTrainStateFunc: (state: TrainState) => void;
    setTestFunc: (flag: boolean) => void;
};

function TestIntro(props: Props) {
    function trianModel() {
        const trainModelFunc = async () => {
            props.setTrainStateFunc("Training");
            const endpoint = process.env.REACT_APP_BASEURL + "/train";
            const params = {
                user: props.info.user,
            };
            const query = new URLSearchParams(params);
            const res = await fetch(endpoint + "?" + query, { method: "GET" });
            if (res.status !== 200) {
                alert("Failed to Test Images");
                props.setTrainStateFunc("UnTrained");
                return;
            }
            props.setTrainStateFunc("Trained");
            alert("Successfully trained the model!");
        };
        trainModelFunc();
    }

    return (
        <div className="border-t-4 px-4 p-2">
            <div className="text-lg font-bold ">Train & Test</div>
            <div className="flex">
                <div>
                    {/* Labeling State. */}
                    <div className="flex divide-x-2 text-lg text-center">
                        <div className="p-2 divide-y-2">
                            <div>Label No.</div>
                            <div>Items Num</div>
                        </div>
                        {props.labelState.map((item: number, idx: number) => {
                            return (
                                <div
                                    key={"labelState-" + idx}
                                    className="p-2 divide-y-2"
                                >
                                    <div>{idx + 1}</div>
                                    <div
                                        className={
                                            item < 1
                                                ? "text-red-600 font-bold"
                                                : item < 3
                                                ? "text-yellow-600 font-bold"
                                                : "text-green-600 font-bold"
                                        }
                                    >
                                        {item}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    The more data, the more accurate the model.
                    <br />
                    But reduce bias in the number of items between labels.
                </div>
                <button
                    className={
                        props.state === "NoData" || props.state === "Trained"
                            ? "m-4 my-auto px-8 py-4 text-xl bg-gray-300 text-white font-bold rounded"
                            : props.state === "Training"
                            ? "m-4 my-auto px-8 py-4 text-xl bg-gray-600 text-white font-bold rounded"
                            : "m-4 my-auto px-8 py-4 text-xl bg-fuchsia-600 text-white font-bold rounded"
                    }
                    onClick={() => {
                        if (props.state !== "NoData") {
                            trianModel();
                        }
                    }}
                >
                    {props.state === "Training"
                        ? "Training"
                        : props.state === "Trained"
                        ? "Trained"
                        : "Train your model"}
                </button>
                <div className="my-auto text-gray-500">
                    <FontAwesomeIcon icon={faChevronRight} size="3x" />
                </div>
                <button
                    className={
                        props.state === "Trained"
                            ? "mx-4 my-auto px-12 py-4 text-xl bg-fuchsia-600 text-white font-bold rounded cursor-pointer"
                            : "mx-4 my-auto px-12 py-4 text-xl bg-gray-300 text-white font-bold rounded"
                    }
                    onClick={() => {
                        if (props.state === "Trained") props.setTestFunc(true);
                    }}
                >
                    Test your model
                </button>
            </div>
        </div>
    );
}

export default TestIntro;
