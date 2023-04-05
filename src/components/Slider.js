import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation} from "swiper";
import * as React from "react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import SliderCard from "./SliderCard";

/**
 * @return {Swiper} swiper
 */
const Slider = () => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={1}
      navigation={true} modules={[Navigation]}
      onSwiper={(swiper) => console.log(swiper)}
    >
      {[1, 2, 3, 4].map((_, index)=>(<SwiperSlide key={index} style={{backgroundColor: "rgba(0,0,0,0)"}}><SliderCard index={index}/></SwiperSlide>))}


    </Swiper>
  );
};

export default Slider;
