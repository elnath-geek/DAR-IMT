import { useDroppable } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { ImageData, InitInfo, TestImage, TrainState } from "../../Type/type";
import ImgThumbnail from "../Parts/ImgThumbnail";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { v4 as uuidv4 } from "uuid";
type Props = {
    images: ImageData[];
    info: InitInfo;
    trainState: TrainState;
    enable: boolean;
    maxlabel: number;
    closeTestFunc: (flag: boolean) => void;
};

type TestResult = {
    id: string;
    result: string;
};

function TestPanel(props: Props) {
    const [testImages, setTestImages] = useState<TestImage[]>([]);
    useEffect(() => {
        const tmp = props.images.filter((image: ImageData) => {
            if (image.label === -1) {
                const item = testImages.filter((testI: TestImage) => {
                    return testI.image.id === image.id;
                });
                return item.length === 0;
            } else {
                return false;
            }
        });
        const addTestImages = tmp.map((image: ImageData) => {
            return {
                id: uuidv4(),
                image: image,
                expect: (props.maxlabel+1) / 2,
                result: -1,
                diff: -1,
            };
        });
        const newTestImages = testImages.filter((testI: TestImage) => {
            const item = props.images.filter((image: ImageData) => {
                return image.label === -1 && testI.image.id === image.id;
            });
            return item.length !== 0;
        });
        setTestImages([...newTestImages, ...addTestImages]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.images]);

    useEffect(() => {
        const tmp = testImages.map((item: TestImage) => {
            return {
                id: item.id,
                image: item.image,
                expect: props.maxlabel / 2,
                result: -1,
                diff: -1,
            };
        });
        setTestImages([...tmp]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.maxlabel]);

    function changeExpect(id: string, newExpect: number) {
        const newTestImages = testImages.map((data: TestImage) => {
            if (data.id === id) {
                return {
                    id: id,
                    image: data.image,
                    expect: newExpect,
                    result: data.result !== -1 ? data.result : -1,
                    diff:
                        Math.round(Math.abs(newExpect - data.result) * digits) /
                        digits,
                };
            } else {
                return data;
            }
        });
        setTestImages(newTestImages);
    }
    function diffRatioColor(diff: number): string {
        const ratio = diff / props.maxlabel;
        let ret = "w-12 font-bold ";
        if (diff === -1) return ret;
        if (ratio < 0.1) ret += "text-green-600 ";
        else if (ratio < 0.3) ret += "text-yellow-600";
        else ret += "text-red-600";
        return ret;
    }
    function diffAverage() {
        let sum = 0;
        testImages.forEach((image: TestImage) => {
            if (image.result !== -1) sum += image.diff;
        });
        if (sum === 0) return -1;
        const ave = sum / testImages.length;
        return Math.round(ave * digits) / digits;
    }

    const { isOver, setNodeRef } = useDroppable({
        id: "TestIntro",
    });
    const style = isOver
        ? {
              border: "2px solid green",
              backgroundColor: "rgba(0,0,0, 0.05)",
          }
        : undefined;

    const digits = 100;
    function estimateImages() {
        const estimateImagesFunc = async () => {
            const endpoint = process.env.REACT_APP_BASEURL + "/test-images";
            const params = {
                user: props.info.user,
            };
            const query = new URLSearchParams(params);
            const res = await fetch(endpoint + "?" + query, { method: "GET" });
            if (res.status !== 200) {
                console.error("Failed to Test Images");
                return;
            }
            const data = await res.json();
            const newTestImages = testImages.map((image: TestImage) => {
                const selectedTestResult = data.filter(
                    (testRes: TestResult) => {
                        return image.image.id === testRes.id;
                    }
                );
                if (selectedTestResult[0]) {
                    const resValue =
                        Number(selectedTestResult[0].result) 
                    const newResult = Math.round(resValue * digits) / digits;
                    return {
                        id: image.id,
                        image: image.image,
                        expect: image.expect,
                        result: newResult,
                        diff:
                            Math.round(
                                Math.abs(image.expect - newResult) * digits
                            ) / digits,
                    };
                } else {
                    return image;
                }
            });
            setTestImages(newTestImages);
        };
        estimateImagesFunc();
    }

    return (
        <div
            className={
                props.enable
                    ? "relative opacity-100 ease-in-out duration-500 block z-20"
                    : "opacity-0 ease-in-out translate-x-full duration-500 scale-x-0"
            }
        >
            <div className="ml-2 my-2 p-4 h-[60vh] shadow bg-fuchsia-100 rounded-l-lg basis-4/5 flex flex-col">
                <div className="flex mb-2">
                    <div onClick={() => props.closeTestFunc(false)}>
                        <FontAwesomeIcon icon={faXmark} size="2x" />
                    </div>
                    <div className="text-xl font-bold ml-4">Train & Test</div>
                    <div className="px-4">
                        User Label for Test: Where the user sets the predicted
                        value. <br />
                        Model Prediction: After testing, model estimates are
                        entered.
                    </div>
                </div>
                <div className="grow overflow-y-scroll without-bar">
                    <div
                        className="border-4 w-full"
                        ref={setNodeRef}
                        style={style}
                    >
                        <div className="flex flex-wrap justify-around overflow-y-scroll without-bar">
                            {(() => {
                                const ret = [];
                                if (testImages.length === 0) {
                                    ret.push(
                                        <div
                                            key={"TestIntro-empty"}
                                            className="text-center text-gray-400 text-xl mx-auto py-4 text-3xl"
                                        >
                                            To Add Test Data, <br /> Drag and
                                            Drop image <br /> to the Center of
                                            this Area
                                        </div>
                                    );
                                } else {
                                    // eslint-disable-next-line array-callback-return
                                    testImages.map((data: TestImage) => {
                                        ret.push(
                                            <div
                                                key={"TestPanel-" + data.id}
                                                className="flex m-2"
                                            >
                                                <ImgThumbnail
                                                    info={data.image}
                                                    size={144}
                                                    hoverEnable={false}
                                                    isDraggable={true}
                                                />
                                                <table className="ml-2 font-bold text-md">
                                                    <tbody>
                                                        <tr>
                                                            <td className="">
                                                                User Label
                                                                <br />
                                                                for Test{" "}
                                                            </td>
                                                            <td className="w-10">
                                                                : {data.expect}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    className="w-24"
                                                                    type="range"
                                                                    min={1}
                                                                    max={
                                                                        props.maxlabel
                                                                    }
                                                                    step="0.1"
                                                                    value={
                                                                        data.expect
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) => {
                                                                        changeExpect(
                                                                            data.id,
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        );
                                                                    }}
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr
                                                            className={
                                                                data.result ===
                                                                -1
                                                                    ? "opacity-50"
                                                                    : ""
                                                            }
                                                        >
                                                            <td className="">
                                                                Model <br />
                                                                Prediction
                                                            </td>
                                                            <td>
                                                                :{" "}
                                                                {data.result ===
                                                                -1
                                                                    ? "-"
                                                                    : data.result}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    className="w-24"
                                                                    type="range"
                                                                    readOnly
                                                                    step={
                                                                        1 /
                                                                        digits
                                                                    }
                                                                    min={0.5}
                                                                    max={
                                                                        props.maxlabel + 0.5
                                                                    }
                                                                    value={
                                                                        data.result
                                                                    }
                                                                />
                                                            </td>
                                                        </tr>
                                                        <tr className="">
                                                            <td className="">
                                                                Diff / Ratio
                                                            </td>
                                                            <td
                                                                className={diffRatioColor(
                                                                    data.diff
                                                                )}
                                                            >
                                                                :{" "}
                                                                {data.result ===
                                                                -1
                                                                    ? "-"
                                                                    : data.diff}
                                                            </td>
                                                            <td
                                                                className={diffRatioColor(
                                                                    data.diff
                                                                )}
                                                            >
                                                                {data.result ===
                                                                -1
                                                                    ? "-"
                                                                    : "/ " +
                                                                      Math.round(
                                                                          (data.diff /
                                                                              props.maxlabel) *
                                                                              100
                                                                      ) +
                                                                      "%"}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    });
                                }
                                return ret;
                            })()}
                        </div>
                    </div>
                </div>
                <div className="flex mx-auto ">
                    <div
                        className={
                            props.trainState === "Trained"
                                ? "mx-auto mt-4 px-12 py-4 text-xl bg-fuchsia-600 text-white font-bold rounded cursor-pointer"
                                : "mx-auto mt-4 px-12 py-4 text-xl bg-gray-300 text-white font-bold rounded"
                        }
                        onClick={() => {
                            if (props.trainState === "Trained")
                                estimateImages();
                        }}
                    >
                        Test All Data
                    </div>
                    <div className="p-4 px-2">
                        {testImages.length} Items.
                    </div>
                    <div className="p-4 pb-2 text-lg">
                        <span className={diffRatioColor(diffAverage())}>
                            Diff Average:{" "}
                            {diffAverage() >= 0
                                ? diffAverage() +
                                  " / " +
                                  Math.round(
                                      (diffAverage() / props.maxlabel) * 100
                                  ) +
                                  "%"
                                : "-"}
                            <br />
                        </span>
                        {diffAverage() / props.maxlabel > 0.3
                            ? "More Data will improve your model."
                            : ""}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default TestPanel;
