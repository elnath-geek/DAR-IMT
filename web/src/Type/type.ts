export interface InitInfo {
    user: string;
    object: string;
    start: string;
    end: string;
}

export interface ImageData {
    id: string;
    url: string;
    generation: number;
    label: number;
}

export interface GenSetting {
    baseImage: ImageData;
    mask: ImageData | undefined
    prompt: string;
    cfg: number;
    cfgLabel: string;
    num: number;
}
export interface History {
    id: string;
    images: ImageData[];
    setting: GenSetting;
}

export interface TestImage {
    id: string;
    image: ImageData;
    expect: number;
    result: number;
    diff: number;
}

export type TrainState =
    | "NoData"
    | "FewData"
    | "UnTrained"
    | "Training"
    | "Trained";
