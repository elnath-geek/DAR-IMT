import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GenerateArea from "./Component/Gen/GenerateArea";
import LabelArea from "./Component/Label/LabelArea";
import ImagePool from "./Component/Left/ImagePool";
import ProjectInit from "./Component/Left/ProjectInit";
import TestIntro from "./Component/TrainTest/TestIntro";
import TestPanel from "./Component/TrainTest/TestPanel";
import { ImageData, InitInfo, TrainState } from "./Type/type";

function App() {
    const search = useLocation().search;
    const query = new URLSearchParams(search);

    const blankImageData: ImageData = {
        id: "blank",
        url: "",
        generation: 0,
        label: -1,
    };

    const [initInfo, setInitInfo] = useState<InitInfo>({
        user: query.get("user") || "",
        object: "",
        start: "",
        end: "",
    });
    const [imagePool, setImagePool] = useState<ImageData[]>([]);
    const [generate, setGenerate] = useState<boolean>(false);
    const [test, setTest] = useState<boolean>(false);
    const [trainState, setTrainState] = useState<TrainState>("NoData");
    const [labelState, setLabelState] = useState<number[]>([]);
    const [baseImage, setBaseImage] = useState<ImageData>(blankImageData);

    const [stepNumber, setStepNumber] = useState<number>(5);

    useEffect(() => {
        const handleBeforeUnload = (e: any) => {
            e.returnValue = "このページを離れますか？";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            uploadInitInfo();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initInfo]);

    useEffect(() => {
        const label_count = new Array(stepNumber).fill(0);
        imagePool.forEach((image: ImageData) => {
            if (image.label > 0) {
                label_count[image.label - 1] += 1;
            }
        });

        // ラベル配列が更新されてたら、処理をする
        if (JSON.stringify(label_count) !== JSON.stringify(labelState)) {
            let trainState: TrainState = "NoData";
            label_count.forEach((num: number) => {
                if (num >= 2) trainState = "UnTrained";
                else if (num >= 1) trainState = "FewData";
                else if (trainState === "UnTrained" && num === 0)
                    trainState = "FewData";
            });
            setLabelState(label_count);
            setTrainState(trainState);
        }

        const timer = setTimeout(() => {
            uploadLabelData();
        }, 200);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagePool]);

    function uploadInitInfo() {
        const endpoint = process.env.REACT_APP_BASEURL + "/init";
        fetch(endpoint, {
            body: JSON.stringify({
                user: initInfo.user,
                object: initInfo.object,
                start: initInfo.start,
                end: initInfo.end,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });
    }

    function uploadLabelData() {
        const endpoint = process.env.REACT_APP_BASEURL + "/upload-labels";
        fetch(endpoint, {
            body: JSON.stringify({
                user: initInfo.user,
                data: imagePool,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            method: "POST",
        });
    }

    function addUnLabeledImage(images: ImageData[]) {
        const newImagePool = [...images, ...imagePool];
        const uniqueImages = Array.from(
            new Map(
                newImagePool.map((image: ImageData) => [image.id, image])
            ).values()
        );
        setImagePool(uniqueImages);
    }

    function setLabel(id: string, label: number) {
        setImagePool(
            imagePool.map((img: ImageData) => {
                if (img.id === id) {
                    img.label = label;
                }
                return img;
            })
        );
    }

    function dragEndFunc(event: DragEndEvent) {
        if (event.over !== null) {
            const imageId = event.active.id.toString().slice(4);
            const labelName = event.over.id;
            if (labelName === "baseImage") {
                setLabel(baseImage.id, 0);

                const newBasedImage = imagePool.filter((img: ImageData) => {
                    return img.id === imageId;
                })[0];
                setBaseImage(newBasedImage ? newBasedImage : blankImageData);
                setLabel(imageId, -2);
            } else if (labelName === "TestIntro") {
                setLabel(imageId, -1);
            } else if (labelName === "trash") {
                setLabel(imageId, -3);
            } else {
                const label = Number(labelName.toString().slice(10));
                setLabel(imageId, label);

                const newBasedImage = imagePool.filter((img: ImageData) => {
                    return img.label === -2;
                })[0];
                setBaseImage(newBasedImage ? newBasedImage : blankImageData);
            }
        }
    }

    return (
        <div className="bg-gray-100 h-screen">
            <div className="container max-w-[1920px] flex p-4 mx-auto">
                <DndContext onDragEnd={dragEndFunc}>
                    <div className="basis-1/5 flex flex-col h-[95vh]">
                        <ProjectInit
                            info={initInfo}
                            setInitInfoFunc={setInitInfo}
                        />
                        <div className="grow overflow-y-scroll without-bar">
                            <ImagePool
                                user={initInfo.user}
                                images={imagePool}
                                addImageFunc={addUnLabeledImage}
                                startGenerateFunc={setGenerate}
                            />
                        </div>
                    </div>
                    <div className="relative basis-4/5 flex flex-col h-[95vh]">
                        <div
                            className={
                                generate
                                    ? "absolute top-0 left-4 right-0 bottom-0 duration-500"
                                    : "hidden"
                            }
                        >
                            <GenerateArea
                                user={initInfo.user}
                                enable={generate}
                                baseImage={baseImage}
                                closeGenerateFunc={setGenerate}
                                addUnLabeledImageFunc={addUnLabeledImage}
                            />
                        </div>
                        <div
                            className={
                                test
                                    ? "absolute left-4 right-0 bottom-0 duration-500"
                                    : "hidden"
                            }
                        >
                            <TestPanel
                                images={imagePool}
                                info={initInfo}
                                trainState={trainState}
                                enable={test}
                                maxlabel={stepNumber}
                                closeTestFunc={setTest}
                            />
                        </div>
                        <div className="grow overflow-y-scroll without-bar">
                            <LabelArea
                                info={initInfo}
                                images={imagePool}
                                steps={stepNumber}
                                isTest={test}
                                setImagesFunc={setImagePool}
                                setStepsFunc={setStepNumber}
                            />
                        </div>
                        <TestIntro
                            images={imagePool}
                            info={initInfo}
                            state={trainState}
                            labelState={labelState}
                            setTrainStateFunc={setTrainState}
                            setTestFunc={setTest}
                        ></TestIntro>
                    </div>
                </DndContext>
            </div>
        </div>
    );
}

export default App;
