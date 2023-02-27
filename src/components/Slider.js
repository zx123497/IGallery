import {Swiper, SwiperSlide} from "swiper/react";
import {Navigation} from "swiper";
import * as React from "react";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

/**
 * @return {Swiper} swiper
 */
const Slider = () => {
  return (
    <Swiper
      spaceBetween={50}
      slidesPerView={1}
      navigation={true} modules={[Navigation]}
      onSlideChange={() => console.log("slide change")}
      onSwiper={(swiper) => console.log(swiper)}
    >
      <SwiperSlide>Slide 1</SwiperSlide>
      <SwiperSlide>Slide 2</SwiperSlide>
      <SwiperSlide>Slide 3</SwiperSlide>
      <SwiperSlide>Slide 4</SwiperSlide>
    </Swiper>
  );
};

export default Slider;
