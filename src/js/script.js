
$(document).ready(function(){


$(".pop_new_menu_li").click( function () {
	$(".pop_new_product").addClass('none');
	$(".pop_new_menu .act").removeClass('act');
	$(this).addClass('act');
	$(".pop_new_product").eq($(this).index()).removeClass('none');
});




$(".customer_info_block_container span.icon").click( function () {

	if($(".customer_info_block").hasClass('act')){
		
		$(".customer_info_block").removeClass('act');
		$("div.visi").slideDown(300);
		
	}else{

		$("div.visi").slideUp(300);
		$(".customer_info_block").addClass('act');

	}
});


/*
$("input.button").click( function () {

	$(this).attr("disabled","true");

	});
*/

});

